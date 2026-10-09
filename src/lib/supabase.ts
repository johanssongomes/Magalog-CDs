import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://alwkfgqylejckbgienju.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dG6fHMjcet0Iek_PiS52IA_1xiveTKh'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
