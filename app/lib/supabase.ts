import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fbjteuenljvsnxwfbspb.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianRldWVubGp2c254d2Zic3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDI3MjUsImV4cCI6MjA3ODk3ODcyNX0.h70B-50cOoglAiWdkdFe1h8W5_Rkw-6aig0VPP81Ts4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

