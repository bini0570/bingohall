const { supabase } = require('./src/db.js');
async function fix() {
  const { data: users } = await supabase.from('users').select('id, balance, withdrawable_balance');
  if (users) {
    let fixed = 0;
    for (const u of users) {
      if (parseFloat(u.withdrawable_balance) > parseFloat(u.balance)) {
        console.log(`Fixing user ${u.id}: withdrawable=${u.withdrawable_balance}, balance=${u.balance}`);
        await supabase.from('users').update({ withdrawable_balance: u.balance }).eq('id', u.id);
        fixed++;
      }
    }
    console.log('Done fixing ' + fixed + ' users');
  }
}
fix();
