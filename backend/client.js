import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.supabaseUrl;
const supabaseServiceKey = process.env.supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
