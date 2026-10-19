import { StrictMode, useEffect } from "react";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useFetch from "./use-fetch";

const auth = vi.hoisted(() => ({ current: null }));
vi.mock("@clerk/clerk-react", () => ({ useSession: () => auth.current }));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function signIn(user = "A", session = `session-${user}`) {
  auth.current = {
    isLoaded: true,
    session: { id: session, user: { id: user }, getToken: vi.fn().mockResolvedValue(`token-${user}`) },
  };
}
beforeEach(() => signIn());

async function start(result, ...args) {
  let promise;
  await act(async () => { promise = result.current.fn(...args); });
  return { promise };
}

describe("useFetch request ownership", () => {
  it("keeps the newest result and returns each invocation's own outcome", async () => {
    const first = deferred(), second = deferred();
    const cb = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useFetch(cb));
    const a = await start(result), b = await start(result);
    await act(async () => { second.resolve("new"); await b.promise; });
    expect(result.current.data).toBe("new");
    expect(result.current.loading).toBe(false);
    let oldResult;
    await act(async () => { first.resolve("old mutation outcome"); oldResult = await a.promise; });
    expect(oldResult.data).toBe("old mutation outcome");
    expect(oldResult.isCurrent()).toBe(false);
    expect(result.current.data).toBe("new");
  });

  it("does not let an older failure stop the newest loading state", async () => {
    const first = deferred(), second = deferred();
    const cb = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useFetch(cb));
    const a = await start(result), b = await start(result);
    await act(async () => { first.reject(new Error("old")); await a.promise; });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => { second.reject(new Error("new")); await b.promise; });
    expect(result.current.error.message).toBe("new");
    expect(result.current.loading).toBe(false);
  });

  it("snapshots callback and flat options before awaiting the token", async () => {
    const token = deferred();
    auth.current.session.getToken.mockReturnValue(token.promise);
    const first = vi.fn().mockResolvedValue("first"), second = vi.fn();
    const options = { job_id: "A" };
    const { result, rerender } = renderHook(({ cb, options }) => useFetch(cb, options), {
      initialProps: { cb: first, options },
    });
    const originalFn = result.current.fn;
    const request = await start(result, { isOpen: true });
    options.job_id = "mutated";
    rerender({ cb: second, options: { job_id: "B" } });
    expect(result.current.fn).toBe(originalFn);
    await act(async () => { token.resolve("token"); await request.promise; });
    expect(first).toHaveBeenCalledWith("token", { job_id: "A" }, { isOpen: true });
    expect(second).not.toHaveBeenCalled();
  });

  it("waits for session readiness and refetches on identity changes without remounting", async () => {
    auth.current = { isLoaded: false, session: undefined };
    const cb = vi.fn(async (token) => token);
    const { result, rerender } = renderHook(() => {
      const request = useFetch(cb);
      const { ready, fn } = request;
      useEffect(() => { if (ready) fn(); }, [ready, fn]);
      return request;
    });
    await start(result);
    expect(cb).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    await act(async () => { signIn(); rerender(); });
    expect(result.current.data).toBe("token-A");
    await act(async () => { signIn("B"); rerender(); });
    expect(result.current.data).toBe("token-B");
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it.each(["account", "session", "sign-out", "resource"])("masks old state and invalidates in-flight work on %s changes", async (change) => {
    const pending = deferred();
    const cb = vi.fn().mockResolvedValueOnce("private A").mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ id }) => useFetch(cb, {}, id), { initialProps: { id: "A" } });
    const initial = await start(result);
    await initial.promise;
    const request = await start(result);
    const oldFn = result.current.fn;
    if (change === "account") signIn("B");
    if (change === "session") signIn("A", "new-session");
    if (change === "sign-out") auth.current = { isLoaded: true, session: null };
    rerender({ id: change === "resource" ? "B" : "A" });
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBeNull();
    expect(result.current.fn).not.toBe(oldFn);
    await act(async () => { pending.resolve("late A"); await request.promise; });
    expect((await request.promise).isCurrent()).toBe(false);
    expect(result.current.data).toBeUndefined();
    const staleCall = await oldFn();
    expect(staleCall.error).toBeInstanceOf(Error);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("does not dispatch an old-account callback after deferred token retrieval", async () => {
    const token = deferred();
    auth.current.session.getToken.mockReturnValue(token.promise);
    const cb = vi.fn();
    const { result, rerender } = renderHook(() => useFetch(cb));
    const request = await start(result);
    signIn("B"); rerender();
    await act(async () => { token.resolve("old-token"); await request.promise; });
    expect(cb).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it.each(["token", "callback"])("invalidates work on unmount during %s", async (stage) => {
    const pending = deferred();
    const cb = vi.fn().mockReturnValue(stage === "callback" ? pending.promise : "done");
    if (stage === "token") auth.current.session.getToken.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useFetch(cb));
    const request = await start(result);
    unmount();
    pending.resolve("done");
    const response = await request.promise;
    expect(response.isCurrent()).toBe(false);
    if (stage === "token") expect(cb).not.toHaveBeenCalled();
    else expect(response.data).toBe("done");
  });

  it("handles StrictMode effect cleanup without dispatching discarded work", async () => {
    const cb = vi.fn().mockResolvedValue("done");
    const { result } = renderHook(() => {
      const request = useFetch(cb);
      const { fn } = request;
      useEffect(() => { fn(); }, [fn]);
      return request;
    }, { wrapper: StrictMode });
    await act(async () => {});
    expect(result.current.data).toBe("done");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it.each([null, "reject", "signed-out"])("reports %s token/session errors without invoking the API", async (mode) => {
    if (mode === "signed-out") auth.current.session = null;
    else if (mode === "reject") auth.current.session.getToken.mockRejectedValue(new Error("token failed"));
    else auth.current.session.getToken.mockResolvedValue(null);
    const cb = vi.fn();
    const { result } = renderHook(() => useFetch(cb));
    const request = await start(result);
    expect((await request.promise).error).toBeInstanceOf(Error);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.loading).toBe(false);
    expect(cb).not.toHaveBeenCalled();
  });
});
