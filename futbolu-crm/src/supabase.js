import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jjgtgkqmxnlxkshykdxv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3Rna3FteG5seGtzaHlrZHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTY4NDUsImV4cCI6MjA5MTQ5Mjg0NX0.jH91dzKwwwaVLZbRyEoBlyIEPjZn5oX_NDIGYGULRAs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
