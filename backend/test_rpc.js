require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: "SELECT 1;" });
  if (error) {
    console.log("RPC Error:", error.message);
  } else {
    console.log("RPC Success:", data);
  }
}
run();
