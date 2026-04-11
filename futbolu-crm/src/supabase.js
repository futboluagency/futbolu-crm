import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jjgtgkqmxnlxkshykdxv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_I1XgUPcgyMP-ujd9Jicv4w_H7UiQ_Qr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
