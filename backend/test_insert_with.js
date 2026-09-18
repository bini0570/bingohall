const { run } = require('./src/db');
(async () => {
  try {
    const res = await run("INSERT INTO withdrawals (user_id, username, phone, method, account_number, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')", [1, 'testuser', '+251', 'Telebirr', '0911', 100]);
    console.log(res);
  } catch(e) {
    console.error(e);
  }
})();
