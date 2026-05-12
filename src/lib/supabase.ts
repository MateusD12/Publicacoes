import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = envUrl && envUrl !== 'YOUR_SUPABASE_URL_HERE' ? envUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE' ? import.meta.env.VITE_SUPABASE_ANON_KEY : 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)