import { useSession } from "@clerk/clerk-react";
import { useCallback, useRef, useState } from "react";

const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const { session } = useSession();
  const cbRef = useRef(cb);
  const optionsRef = useRef(options);

  cbRef.current = cb;
  optionsRef.current = options;

  const fn = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const supabaseAccessToken = await session.getToken({
        template: "supabase",
      });
      const response = await cbRef.current(
        supabaseAccessToken,
        optionsRef.current,
        ...args
      );
      setData(response);
      setError(null);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  return { data, loading, error, fn };
};

export default useFetch;
