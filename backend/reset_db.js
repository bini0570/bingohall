require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clearData() {
  console.log("Clearing fake data...");

  // Delete all tickets
  await supabase.from('tickets').delete().neq('id', 0);
  console.log("Cleared tickets.");

  // Delete all game_rounds
  await supabase.from('game_rounds').delete().neq('id', 0);
  console.log("Cleared game_rounds.");

  // Delete all deposits
  await supabase.from('deposits').delete().neq('id', 0);
  console.log("Cleared deposits.");

  // Delete all withdrawals
  await supabase.from('withdrawals').delete().neq('id', 0);
  console.log("Cleared withdrawals.");

  // Delete all referrals
  await supabase.from('referrals').delete().neq('id', 0);
  console.log("Cleared referrals.");

  // Delete all users except admin
  const { data: users } = await supabase.from('users').select('id, username');
  for (let u of (users || [])) {
    if (u.username !== 'admin') {
      await supabase.from('users').delete().eq('id', u.id);
    }
  }
  console.log("Cleared all users except admin.");
  
  // Try to clear promo_codes and tasks if they exist
  const { error: e1 } = await supabase.from('promo_codes').delete().neq('id', 0);
  if (!e1) console.log("Cleared promo_codes.");
  
  const { error: e2 } = await supabase.from('tasks').delete().neq('id', 0);
  if (!e2) console.log("Cleared tasks.");

  const { error: e3 } = await supabase.from('transactions').delete().neq('id', 0);
  if (!e3) console.log("Cleared transactions.");

  console.log("Database cleared successfully!");
}

clearData();
