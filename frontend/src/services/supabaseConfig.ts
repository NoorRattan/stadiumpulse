import { createClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

export const supabase = createClient(
  env.VITE_SUPABASE_URL ?? "",
  env.VITE_SUPABASE_ANON_KEY ?? "",
);
