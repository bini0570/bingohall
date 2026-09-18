const { run, supabase } = require('./src/db');
(async () => {
  try {
    const { data: users } = await supabase.from('users').select('id').not('telegram_id', 'is', null).limit(1);
    const userId = users[0].id;
    console.log("Using user_id:", userId);
    
    const res = await run("INSERT INTO deposits (user_id, username, phone, method, amount, proof_image, receipt_sms, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [userId, 'testuser', '+251', 'Telebirr', 100, null, 'SMS123']);
    console.log(res);
  } catch(e) {
    console.error(e);
  }
})();
