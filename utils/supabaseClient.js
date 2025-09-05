/**
 * Supabase server client
 *
 * This module initializes the Supabase client using the SERVICE role key.
 * Use this on the server for uploading and removing files. The SERVICE role key
 * must be kept secret and stored in SUPABASE_SERVICE_KEY.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn(
    'Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase operations will fail until these environment variables are configured.'
  );
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  // recommended for server-side SDK usage
  auth: {
    persistSession: false
  }
});

module.exports = {
  supabaseAdmin
};
