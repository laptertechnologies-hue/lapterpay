import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import WebSocket from 'ws';

// Define WebSocket globally for Node.js < 22 compatibility with Supabase
(global as any).WebSocket = WebSocket;

// Try to load env file from project root or server folder
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn('WARNING: SUPABASE_URL is not defined in environment variables.');
}

if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. Backend admin actions will fail.');
}

// Admin client bypasses RLS - necessary for backend API ledger updates & API key checks
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
