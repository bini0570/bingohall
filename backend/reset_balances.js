// reset_balances.js
// Resets ALL non-admin users: balance = 20 (registration bonus only), withdrawable_balance = 0

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function resetBalances() {
  // Fetch all users
  const { data: users, error } = await supabase.from('users').select('id, username, balance, withdrawable_balance, is_admin');
  if (error) { console.error('Fetch error:', error); process.exit(1); }

  console.log(`Found ${users.length} users.\n`);

  for (const user of users) {
    if (user.is_admin) {
      console.log(`  SKIPPING admin: ${user.username}`);
      continue;
    }
    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: 20, withdrawable_balance: 0 })
      .eq('id', user.id);

    if (updateErr) {
      console.log(`  ERROR resetting ${user.username}: ${updateErr.message}`);
    } else {
      console.log(`  RESET: ${user.username} → balance=20 ETB, withdrawable=0`);
    }
  }

  console.log('\n✅ Done! All users reset to 20 ETB registration bonus only.');
  process.exit(0);
}

resetBalances().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
