const { createClient } = require('@supabase/supabase-js');

// Hostinger will automatically set these environment variables when connected, 
// or they can be loaded from .env / .env.local locally.
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Warning: Supabase URL or Key is missing from environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Querying the 'estimates' table from the Supabase project
async function fetchEstimates() {
  try {
    const { data, error } = await supabase
      .from('estimates')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Error fetching estimates from Supabase:', error.message);
    } else {
      console.log('Successfully connected to Supabase! Fetched estimates:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

fetchEstimates();

module.exports = { supabase };
