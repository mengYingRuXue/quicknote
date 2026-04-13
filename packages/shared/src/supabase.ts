import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@quicknote/types";

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}
