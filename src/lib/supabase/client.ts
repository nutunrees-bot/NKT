import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.",
  );
}

// Single shared browser client. Uses the anon key — safe to expose to the
// client since access is (currently) gated by RLS policies, not this key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
