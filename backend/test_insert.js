const { run } = require('./src/db');
(async () => {
  try {
    const res = await run("INSERT INTO deposits (user_id, username, phone, method, amount, proof_image, receipt_sms, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')", [1, 'testuser', '+25191112233', 'Telebirr', 100, null, 'SMS123']);
    console.log(res);
  } catch(e) {
    console.error(e);
  }
})();
