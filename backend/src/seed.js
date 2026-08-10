const bcrypt = require('bcryptjs');
const { initDB, run, get } = require('./db');

async function seedData() {
  console.log('Seeding initial database test records...');
  await initDB();

  const hash = await bcrypt.hash('pass123', 10);

  // 1. Seed test users
  const users = [
    { username: 'kebede', phone: '0911112233', balance: 250.0, ref: 'KEBE10', refBy: 'ADMIN00' },
    { username: 'almaz', phone: '0922334455', balance: 420.0, ref: 'ALMA20', refBy: 'KEBE10' },
    { username: 'chala', phone: '0933445566', balance: 100.0, ref: 'CHAL30', refBy: 'ALMA20' }
  ];

  for (const u of users) {
    const existing = await get(`SELECT id FROM users WHERE username = ?`, [u.username]);
    if (!existing) {
      await run(
        `INSERT INTO users (username, phone, password_hash, balance, referral_code, referred_by) VALUES (?, ?, ?, ?, ?, ?)`,
        [u.username, u.phone, hash, u.balance, u.ref, u.refBy]
      );
      console.log(`Seeded user: ${u.username}`);
    }
  }

  // 2. Seed pending deposit requests for Telebirr & CBE
  const kebede = await get(`SELECT id FROM users WHERE username = 'kebede'`);
  const almaz = await get(`SELECT id FROM users WHERE username = 'almaz'`);

  if (kebede) {
    const existingDep = await get(`SELECT id FROM deposits WHERE user_id = ?`, [kebede.id]);
    if (!existingDep) {
      await run(
        `INSERT INTO deposits (user_id, username, phone, method, amount, receipt_sms, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [
          kebede.id,
          'kebede',
          '0911112233',
          'Telebirr',
          500.0,
          'Telebirr transaction confirmation SMS: Ref TXN987654321, 500 ETB sent to Bingo Platform.'
        ]
      );
      console.log('Seeded pending Telebirr deposit for Kebede');
    }
  }

  if (almaz) {
    const existingWith = await get(`SELECT id FROM withdrawals WHERE user_id = ?`, [almaz.id]);
    if (!existingWith) {
      await run(
        `INSERT INTO withdrawals (user_id, username, phone, method, account_number, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [almaz.id, 'almaz', '0922334455', 'CBE', '1000987654321', 200.0]
      );
      console.log('Seeded pending CBE withdrawal for Almaz');
    }
  }

  console.log('Seed completed successfully!');
  process.exit(0);
}

seedData();
