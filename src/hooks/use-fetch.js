import { useSession } from "@clerk/clerk-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

const idleState = { data: undefined, loading: null, error: null };

// key identifies a resource (for example a route ID), not transient query options.
const useFetch = (cb, options = {}, key = null) => {
  const { session, isLoaded } = useSession();
  const sessionId = session?.id;
  const userId = session?.user?.id;
  const ready = Boolean(isLoaded && session);
  const owner = useMemo(() => ({
    sessionId, userId, ready, key,
    active: false, generation: 0, request: 0,
  }), [sessionId, userId, ready, key]);
  const inputs = useRef(null);
  const [state, setState] = useState(idleState);

  // Publish only committed inputs; abandoned renders must not retarget requests.
  useLayoutEffect(() => {
    inputs.current = { cb, options, session, isLoaded };
  });

  useLayoutEffect(() => {
    owner.active = true;
    owner.generation += 1;
    return () => {
      owner.active = false;
      owner.generation += 1;
    };
  }, [owner]);

  // Stable within an identity/resource, changes when effects need to refetch.
  const fn = useCallback(async (...args) => {
    const generation = owner.generation;
    const request = ++owner.request;
    const isOwned = () => owner.active && owner.generation === generation;
    const isCurrent = () => isOwned() && owner.request === request;
    const result = (data, error) => ({ data, error, isCurrent });
    if (!isOwned()) {
      return result(undefined, new Error("This request is no longer active."));
    }

    // All current options are flat values. Copy them before token retrieval.
    const { cb: callback, options: currentOptions, session: currentSession, isLoaded: loaded } = inputs.current;
    const invocationOptions = { ...currentOptions };
    if (!loaded) {
      return result(undefined, new Error("Your session is still loading."));
    }
    setState((previous) => ({
      ...(previous.owner === owner ? previous : idleState),
      owner, loading: true, error: null,
    }));

    try {
      if (!currentSession) throw new Error("Please sign in to continue.");
      const token = await currentSession.getToken({ template: "supabase" });
      // A token obtained for an obsolete account/route must not start an API call.
      if (!isOwned()) throw new Error("This request is no longer active.");
      if (!token) throw new Error("Your session expired. Please sign in again.");
      const response = await callback(token, invocationOptions, ...args);
      if (isCurrent()) {
        setState({ owner, data: response, error: null, loading: false });
      }
      // Already dispatched mutations can still succeed. Return their real outcome,
      // but callers must check isCurrent() before changing UI or navigating.
      return result(response, null);
    } catch (error) {
      if (isCurrent()) {
        setState((previous) => ({ ...previous, owner, error, loading: false }));
      }
      return result(undefined, error);
    }
  }, [owner]);

  // Mask old state during render, before effects run on an identity/route change.
  const visible = state.owner === owner ? state : idleState;
  return { data: visible.data, loading: visible.loading, error: visible.error, ready, fn };
};

export default useFetch;
