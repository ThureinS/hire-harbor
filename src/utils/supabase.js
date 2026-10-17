import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
  });
  // set Supabase JWT on the client object,
  // so it is sent up with all Supabase requests
  return supabase;
};

// Require a returned row before the UI reports success. An empty result does
// not establish whether a write occurred or whether RLS is correctly configured.
export function assertRowsAffected(data, message) {
  if (!data?.length) throw new Error(message);
}

export default supabaseClient;
