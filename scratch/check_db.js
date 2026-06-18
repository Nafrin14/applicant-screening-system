const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read env variables from .env
const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('applicants').select('*').limit(1);
  if (error) {
    console.error('Error fetching applicants:', error);
  } else {
    console.log('Applicant record:', JSON.stringify(data?.[0], null, 2));
  }
}

test();
