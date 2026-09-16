require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const { initDB, run, get, all } = require('./db');
const BingoEngine = require('./bingoEngine');
const { initTelegramBot, sendTelegramNotification, notifyAdminNewDeposit, notifyAdminNewWithdrawal } = require('./telegramBot');

const JWT_SECRET = process.env.JWT_SECRET || 'bingo_secret_key_2026';
const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ── Static file serving ─────────────────────────────────────
// Player SPA  →  /       (built to dist/)
// Admin SPA   →  /admin  (built to admin-dist/)
// ────────────────────────────────────────────────────────────
const playerDistPath = fs.existsSync(path.join(__dirname, '../dist'))
  ? path.join(__dirname, '../dist')
  : path.join(__dirname, '../../frontend/dist');
const adminDistPath = path.join(__dirname, '../admin-dist');

// Serve admin SPA FIRST so /admin/* is matched before the player catch-all
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath));
  // SPA fallback — any /admin/* path that isn't a file serves admin index.html
  app.get('/admin', (req, res) => res.sendFile(path.join(adminDistPath, 'index.html')));
  app.get('/admin/*', (req, res) => res.sendFile(path.join(adminDistPath, 'index.html')));
}

// Serve player SPA
if (fs.existsSync(playerDistPath)) {
  app.use(express.static(playerDistPath));
}

// Uploads directory for payment proof screenshots
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `proof_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

// Initialize Bingo Engine
const bingoEngine = new BingoEngine(io);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  });
};

const adminRoutes = require('./routes/admin');
app.use('/api/admin_v2', authenticateAdmin, adminRoutes);

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, phone, password, referralCode } = req.body;
    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Username, phone, and password are required' });
    }

    const existingUser = await get(`SELECT * FROM users WHERE username = ? OR phone = ?`, [username, phone]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or Phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const myRefCode = username.toUpperCase().substring(0, 4) + Math.floor(1000 + Math.random() * 9000);

    const result = await run(
      `INSERT INTO users (username, phone, password_hash, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)`,
      [username, phone, passwordHash, myRefCode, referralCode || null]
    );
    // ↑ param order matches db.js run(): [username, phone, password_hash, referral_code, referred_by]

    const userId = result.lastID;

    // Track referral relationship if valid
    if (referralCode) {
      const referrer = await get(`SELECT id FROM users WHERE referral_code = ?`, [referralCode.trim()]);
      if (referrer) {
        await run(`INSERT INTO referrals (referrer_id, referee_id, status, reward_amount) VALUES (?, ?, 'pending', 10.0)`, [
          referrer.id,
          userId
        ]);
      }
    }

    const token = jwt.sign({ id: userId, username, phone, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: userId, username, phone, balance: 0.0, referralCode: myRefCode, isAdmin: false }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Phone/Username and Password required' });
    }

    const user = await get(`SELECT * FROM users WHERE username = ? OR phone = ?`, [identifier, identifier]);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been suspended by admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, phone: user.phone, isAdmin: !!user.is_admin }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referral_code,
        isAdmin: !!user.is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/telegram-mini-app', async (req, res) => {
  try {
    const { telegramId, username: tgUsername, firstName } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'telegramId is required' });

    let user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [String(telegramId)]);

    if (!user || !user.phone || user.phone.startsWith('tg_')) {
      return res.status(400).json({
        error: 'Phone Registration Required: Please open @bingox2019_bot in Telegram and tap "SHARE PHONE NUMBER TO REGISTER" to activate your account.'
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone, isAdmin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referral_code,
        isAdmin: !!user.is_admin
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// Secure Telegram WebApp auth using HMAC-verified initData
// ---------------------------------------------------------------
const crypto = require('crypto');

app.post('/api/auth/telegram-webapp', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'initData is required' });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8926254654:AAGDWlvP8g_J6_Xdh8P8vIQRgYsn8reK2Dk';

    // Verify HMAC signature per Telegram spec
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (expectedHash !== hash) {
      return res.status(403).json({ error: 'Invalid Telegram initData signature — access denied.' });
    }

    const userParam = params.get('user');
    if (!userParam) return res.status(400).json({ error: 'No user data in initData' });

    const tgUser = JSON.parse(userParam);
    const telegramId = String(tgUser.id);
    const tgUsername = tgUser.username || tgUser.first_name || `user_${telegramId}`;

    let user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);

    // Not yet registered via bot phone share
    if (!user || !user.phone || user.phone.startsWith('tg_')) {
      return res.status(200).json({
        requiresPhoneRegistration: true,
        telegramId,
        username: tgUsername,
        message: `Welcome ${tgUser.first_name}! Please open @bingox2019_bot in Telegram and share your phone number to complete registration and receive your 🎁 20 ETB welcome bonus.`
      });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Your account has been suspended by admin.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone, isAdmin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        balance: user.balance,
        referralCode: user.referral_code,
        isAdmin: !!user.is_admin,
        telegramId
      }
    });
  } catch (err) {
    console.error('[TelegramWebApp Auth]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await get(`SELECT * FROM users WHERE id = ?`, [
      req.user.id
    ]);

    const gamesPlayedRow = await get(`SELECT COUNT(*) as count FROM tickets WHERE user_id = ?`, [req.user.id]);

    const gamesWonRow = await get(
      `SELECT COUNT(*) as count FROM game_rounds WHERE winner_ids LIKE ?`,
      [`%${req.user.id}%`]
    );

    const refEarnedRow = await get(
      `SELECT SUM(reward_amount) as total FROM referrals WHERE referrer_id = ? AND status = 'qualified'`,
      [req.user.id]
    );

    const referralEarnings = refEarnedRow && refEarnedRow.total ? parseFloat(refEarnedRow.total) : 0;
    const totalBalance = parseFloat(user.balance) || 0;
    const withdrawableBalance = parseFloat(user.withdrawable_balance) || 0;
    // Bonus = referral rewards earned (tracked in referrals table)
    // Non-withdrawable = everything except winnings (deposits + bonuses — playable only)
    const nonWithdrawableBalance = Math.max(0, totalBalance - withdrawableBalance);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        balance: totalBalance,
        withdrawableBalance,
        bonusBalance: referralEarnings,
        nonWithdrawableBalance,
        hasDeposited: !!(user.has_deposited),
        referralCode: user.referral_code,
        isAdmin: !!user.is_admin,
        gamesPlayed: gamesPlayedRow ? gamesPlayedRow.count : 0,
        gamesWon: gamesWonRow ? gamesWonRow.count : 0,
        referralEarnings
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// WALLET ROUTES (Telebirr & CBE)
// -------------------------------------------------------------

app.post('/api/wallet/deposit', authenticateToken, upload.single('proofImage'), async (req, res) => {
  try {
    const { method, amount, receiptSms } = req.body;
    if (!method || !amount || !receiptSms) {
      return res.status(400).json({ error: 'Payment method, amount, and receipt SMS text are required' });
    }
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 10) {
      return res.status(400).json({ error: 'Minimum deposit amount is 10 ETB' });
    }

    const user = await get(`SELECT username, phone FROM users WHERE id = ?`, [req.user.id]);
    const proofImagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await run(
      `INSERT INTO deposits (user_id, username, phone, method, amount, proof_image, receipt_sms, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, user.username, user.phone, method, parseFloat(amount), proofImagePath, receiptSms]
    );

    io.emit('admin_data_changed');
    notifyAdminNewDeposit({
      id: result.lastID,
      username: user.username,
      phone: user.phone,
      method,
      amount: parseFloat(amount),
      receipt_sms: receiptSms
    });

    res.json({ success: true, depositId: result.lastID, message: 'Deposit request submitted for Admin review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    const { method, accountNumber, accountName, amount } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!method || !accountNumber || !withdrawAmount || withdrawAmount < 1) {
      return res.status(400).json({ error: 'Valid method, destination account, and amount (min 1 ETB) are required' });
    }

    const user = await get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);

    // Rule 1: Must have made at least one deposit first (check flag or deposits table)
    const depCheck = await get(`SELECT COUNT(*) as count FROM deposits WHERE user_id = ? AND status = 'approved'`, [req.user.id]);
    const hasApprovedDeposit = depCheck && depCheck.count > 0;
    if (!user.has_deposited && !hasApprovedDeposit) {
      return res.status(400).json({
        error: 'You must make at least one deposit before you can withdraw. This is a one-time requirement to verify your account.'
      });
    }
    if (hasApprovedDeposit && !user.has_deposited) {
      await run(`UPDATE users SET has_deposited = 1 WHERE id = ?`, [req.user.id]).catch(() => {});
    }

    // Rule 2: Only withdrawable_balance (winnings) can be withdrawn
    const withdrawableBal = parseFloat(user.withdrawable_balance) || 0;
    if (withdrawableBal < withdrawAmount) {
      return res.status(400).json({
        error: `Insufficient withdrawable balance. You can only withdraw winnings. Your current withdrawable balance is ${withdrawableBal.toFixed(2)} ETB. Deposited funds and referral bonuses are non-withdrawable and can only be used to buy tickets.`
      });
    }

    const result = await run(
      `INSERT INTO withdrawals (user_id, username, phone, method, account_number, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [req.user.id, user.username, user.phone, method, accountNumber, withdrawAmount]
    );
    // Also save account name if provided (for admin reference)
    if (accountName && result.lastID) {
      await run(`UPDATE withdrawals SET account_name = ? WHERE id = ?`, [accountName, result.lastID]).catch(() => {});
    }

    // Notify admin panel in real time
    io.emit('admin_data_changed');

    notifyAdminNewWithdrawal({
      id: result.lastID,
      username: user.username,
      phone: user.phone,
      method,
      amount: withdrawAmount,
      account_number: accountNumber
    });

    res.json({ success: true, withdrawalId: result.lastID, message: 'Withdrawal request submitted for Admin review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const deposits = await all(`SELECT * FROM deposits WHERE user_id = ? ORDER BY id DESC`, [req.user.id]);
    const withdrawals = await all(`SELECT * FROM withdrawals WHERE user_id = ? ORDER BY id DESC`, [req.user.id]);

    res.json({ deposits, withdrawals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// REFERRAL ROUTE
// -------------------------------------------------------------

app.get('/api/referrals', authenticateToken, async (req, res) => {
  try {
    const user = await get(`SELECT referral_code FROM users WHERE id = ?`, [req.user.id]);
    const referrals = await all(
      `SELECT r.*, u.username as referee_name, u.created_at as joined_at FROM referrals r JOIN users u ON r.referee_id = u.id WHERE r.referrer_id = ? ORDER BY r.id DESC`,
      [req.user.id]
    );

    const totalEarnedRow = await get(
      `SELECT SUM(reward_amount) as total FROM referrals WHERE referrer_id = ? AND status = 'qualified'`,
      [req.user.id]
    );

    res.json({
      referralCode: user.referral_code,
      referralLink: `https://t.me/bingox2019_bot?start=${user.referral_code}`,
      totalEarned: totalEarnedRow && totalEarnedRow.total ? totalEarnedRow.total : 0.0,
      referralsCount: referrals.length,
      referrals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GAME ROUTE
// -------------------------------------------------------------

app.post('/api/game/buy-ticket', authenticateToken, async (req, res) => {
  try {
    const { cartellaIndex } = req.body;
    const result = await bingoEngine.purchaseTicket(req.user.id, req.user.username, parseInt(cartellaIndex));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/game/unselect-ticket', authenticateToken, async (req, res) => {
  try {
    const { cartellaIndex } = req.body;
    const result = await bingoEngine.unselectTicket(req.user.id, parseInt(cartellaIndex));
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/game/state', (req, res) => {
  res.json(bingoEngine.getPublicState());
});

app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await get(`SELECT * FROM users WHERE username = ?`, [username]);
    if (!user) {
      return res.status(400).json({ error: 'Admin account not found' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Access denied: User is not an admin' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone, isAdmin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        balance: user.balance,
        isAdmin: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN PANEL ROUTES
// -------------------------------------------------------------

app.post('/api/admin/game/force-start', authenticateAdmin, async (req, res) => {
  try {
    const result = await bingoEngine.forceStartDraw();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/game/restart-countdown', authenticateAdmin, async (req, res) => {
  try {
    const result = bingoEngine.restartCountdownAdmin();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/admin/metrics', authenticateAdmin, async (req, res) => {
  try {
    const usersList = await all(`SELECT * FROM users`);
    const totalSystemBalance = usersList.reduce((acc, u) => acc + (parseFloat(u.balance) || 0), 0);
    const usersCount = usersList.length;

    const totalDepositsRow = await get(`SELECT SUM(amount) as sum FROM deposits WHERE status = 'approved'`);
    const totalWithdrawalsRow = await get(`SELECT SUM(amount) as sum FROM withdrawals WHERE status = 'approved'`);
    const totalTicketsRow = await get(`SELECT SUM(total_tickets) as sum, SUM(commission_cut) as comm FROM game_rounds`);

    const gameState = bingoEngine ? bingoEngine.getPublicState() : {};

    res.json({
      totalSystemBalance: totalSystemBalance || 0,
      totalUsers: usersCount,
      onlinePlayers: io.engine.clientsCount || 1,
      cartellasSoldThisRound: gameState.purchasedTickets ? gameState.purchasedTickets.length : 0,
      prizePool: gameState.prizePool || 0,
      gameStatus: gameState.status || 'WAITING',
      countdownSec: bingoEngine ? bingoEngine.secondsLeft : 40,
      revenueToday: totalTicketsRow?.comm || 0,
      payoutsToday: totalWithdrawalsRow?.sum || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/deposits', authenticateAdmin, async (req, res) => {
  try {
    const deposits = await all(`SELECT * FROM deposits ORDER BY status = 'pending' DESC, id DESC`);
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/deposits/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const depositId = req.params.id;
    const deposit = await get(`SELECT * FROM deposits WHERE id = ?`, [depositId]);

    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ error: 'Deposit not found or already processed' });
    }

    // Mark approved
    await run(`UPDATE deposits SET status = ? WHERE id = ?`, ['approved', depositId]);

    // Credit user wallet (deposit goes to non-withdrawable balance)
    await run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [deposit.amount, deposit.user_id]);

    // Mark that user has deposited (one-time flag, enables withdrawal eligibility)
    await run(`UPDATE users SET has_deposited = 1 WHERE id = ?`, [deposit.user_id]);

    // Check Qualifying Action for Referral Bonus (First Approved Deposit)
    const refRecord = await get(`SELECT * FROM referrals WHERE referee_id = ? AND status = 'pending'`, [deposit.user_id]);
    if (refRecord) {
      // Mark referral qualified & pay 10 ETB reward to referrer (goes to non-withdrawable balance)
      await run(`UPDATE referrals SET status = 'qualified' WHERE id = ?`, [refRecord.id]);
      await run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [refRecord.reward_amount, refRecord.referrer_id]);

      const referrer = await get(`SELECT telegram_id FROM users WHERE id = ?`, [refRecord.referrer_id]);
      if (referrer && referrer.telegram_id) {
        sendTelegramNotification(
          referrer.telegram_id,
          `🎁 *Referral Reward Claimed!* Your referred player made their first deposit. You earned *10 ETB*!`
        );
      }
    }

    const updatedUser = await get(`SELECT * FROM users WHERE id = ?`, [deposit.user_id]);

    if (updatedUser?.telegram_id) {
      sendTelegramNotification(
        updatedUser.telegram_id,
        `✅ *Deposit Approved!* Your account has been credited with *${deposit.amount} ETB*. New Balance: *${updatedUser.balance} ETB*.`
      );
    }

    // Real-time socket notification
    io.emit('admin_data_changed');
    io.emit('balance_updated', { userId: deposit.user_id, newBalance: updatedUser?.balance });

    res.json({ success: true, message: 'Deposit approved and balance credited.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/deposits/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const depositId = req.params.id;
    const { reason } = req.body;
    const deposit = await get(`SELECT * FROM deposits WHERE id = ?`, [depositId]);

    if (!deposit || deposit.status !== 'pending') {
      return res.status(400).json({ error: 'Deposit not found or already processed' });
    }

    await run(`UPDATE deposits SET status = ? WHERE id = ?`, ['rejected', depositId]);

    // Notify user with rejection reason
    if (deposit) {
      const user = await get(`SELECT telegram_id FROM users WHERE id = ?`, [deposit.user_id]);
      if (user?.telegram_id) {
        const reasonText = reason ? `\n\n❌ *Reason:* ${reason}` : '';
        sendTelegramNotification(
          user.telegram_id,
          `❌ *Deposit Rejected*\n\nYour deposit of *${deposit.amount} ETB* via ${deposit.method} was rejected.${reasonText}\n\nPlease contact support or try again.`
        );
      }
    }

    io.emit('admin_data_changed');
    io.emit('user_transaction_updated', { userId: deposit.user_id });
    res.json({ success: true, message: 'Deposit request rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/withdrawals', authenticateAdmin, async (req, res) => {
  try {
    const withdrawals = await all(`SELECT * FROM withdrawals ORDER BY status = 'pending' DESC, id DESC`);
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawals/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    const wId = req.params.id;
    const withdrawal = await get(`SELECT * FROM withdrawals WHERE id = ?`, [wId]);

    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal not found or already processed' });
    }

    // Deduct from both total balance and withdrawable_balance
    const user = await get(`SELECT * FROM users WHERE id = ?`, [withdrawal.user_id]);
    const withdrawableBal = parseFloat(user.withdrawable_balance) || 0;
    if (withdrawableBal < withdrawal.amount) {
      return res.status(400).json({ error: 'User withdrawable balance is now insufficient for this withdrawal' });
    }

    await run(`UPDATE withdrawals SET status = ? WHERE id = ?`, ['approved', wId]);
    await run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [withdrawal.amount, withdrawal.user_id]);
    await run(`UPDATE users SET withdrawable_balance = withdrawable_balance - ? WHERE id = ?`, [withdrawal.amount, withdrawal.user_id]);

    const updatedUser = await get(`SELECT balance FROM users WHERE id = ?`, [withdrawal.user_id]);

    if (user.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `💸 *Withdrawal Approved!* Your withdrawal of *${withdrawal.amount} ETB* to ${withdrawal.account_number} (${withdrawal.method}) has been processed.`
      );
    }

    io.emit('admin_data_changed');
    io.emit('balance_updated', { userId: withdrawal.user_id, newBalance: updatedUser?.balance });

    res.json({ success: true, message: 'Withdrawal approved and completed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/withdrawals/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const wId = req.params.id;
    const { reason } = req.body;
    const withdrawal = await get(`SELECT * FROM withdrawals WHERE id = ?`, [wId]);

    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal not found or already processed' });
    }

    await run(`UPDATE withdrawals SET status = ? WHERE id = ?`, ['rejected', wId]);

    // Notify user with rejection reason
    if (withdrawal) {
      const user = await get(`SELECT telegram_id FROM users WHERE id = ?`, [withdrawal.user_id]);
      if (user?.telegram_id) {
        const reasonText = reason ? `\n\n❌ *Reason:* ${reason}` : '';
        sendTelegramNotification(
          user.telegram_id,
          `❌ *Withdrawal Rejected*\n\nYour withdrawal of *${withdrawal.amount} ETB* to ${withdrawal.account_number} was rejected.${reasonText}\n\nPlease contact support or try again.`
        );
      }
    }

    io.emit('admin_data_changed');
    io.emit('user_transaction_updated', { userId: withdrawal.user_id });
    res.json({ success: true, message: 'Withdrawal rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await all(`SELECT id, username, phone, balance, referral_code, is_banned, created_at FROM users ORDER BY id DESC`);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/balance', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { action, amount, balance } = req.body;
    const val = parseFloat(amount !== undefined ? amount : balance) || 0;

    if (action === 'add') {
      await run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [val, userId]);
    } else if (action === 'deduct') {
      await run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [val, userId]);
    } else {
      await run(`UPDATE users SET balance = ? WHERE id = ?`, [val, userId]);
    }

    const updatedUser = await get(`SELECT balance FROM users WHERE id = ?`, [userId]);

    io.emit('admin_data_changed');
    io.emit('balance_updated', { userId, newBalance: updatedUser?.balance });

    res.json({ success: true, message: 'User balance updated', newBalance: updatedUser?.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/ban', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await get(`SELECT is_banned FROM users WHERE id = ?`, [userId]);
    const newStatus = user.is_banned ? 0 : 1;
    await run(`UPDATE users SET is_banned = ? WHERE id = ?`, [newStatus, userId]);
    res.json({ success: true, isBanned: !!newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM game_settings`);
    const settings = {};
    rows.forEach(r => (settings[r.key] = r.value));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = req.body; // { ticket_price, commission_pct, countdown_sec, draw_speed_sec, referral_reward_etb }
    for (const [key, val] of Object.entries(settings)) {
      await run(`INSERT INTO game_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?`, [
        key,
        String(val),
        String(val)
      ]);
    }
    await bingoEngine.loadSettings();
    res.json({ success: true, message: 'Game settings updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/broadcast', authenticateAdmin, async (req, res) => {
  try {
    const { target, message } = req.body; // target: 'web', 'telegram', 'both', 'online'

    if (target === 'web' || target === 'both') {
      io.emit('broadcast_message', { message, timestamp: new Date() });
    }

    if (target === 'online') {
      // Emit only to currently connected socket clients
      io.emit('broadcast_message', { message, timestamp: new Date() });
    }

    if (target === 'telegram' || target === 'both') {
      const tgUsers = await all(`SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL`);
      for (const u of tgUsers) {
        sendTelegramNotification(u.telegram_id, `📢 *Announcement:*\n\n${message}`);
      }
    }

    res.json({ success: true, message: 'Broadcast message sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// PUBLIC SETTINGS API (For frontend wallet/game configurations)
// -------------------------------------------------------------
app.get('/api/public/settings', async (req, res) => {
  try {
    const rows = await all("SELECT * FROM game_settings");
    const settings = {};
    rows.forEach(r => (settings[r.key] = r.value));
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Player SPA catch-all — serves index.html for any non-API, non-admin route
// Must be placed AFTER all API routes
app.get('*', (req, res, next) => {
  // Don't intercept /api/* or /admin/* — let them 404 naturally
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) return next();
  const indexPath = path.join(playerDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

// Socket.io Connection Logic
io.on('connection', socket => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.emit('round_state', bingoEngine.getPublicState());

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Start Server
async function startServer() {
  try {
    await initDB();
  } catch (e) {
    console.error('[FATAL] initDB failed:', e.message);
  }

  // Start HTTP server first so Railway health checks pass
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🎰 Bingo Platform Backend running on port ${PORT}`);
    console.log(`===================================================`);
  });

  // Init game engine and telegram in background (won't crash server if they fail)
  try {
    await bingoEngine.init();
  } catch (e) {
    console.error('[BingoEngine] Init error (non-fatal):', e.message);
    // Retry game engine init after 5s
    setTimeout(() => bingoEngine.init().catch(e2 => console.error('[BingoEngine] Retry failed:', e2.message)), 5000);
  }

  try {
    initTelegramBot(io);
  } catch (e) {
    console.error('[Telegram] Init error (non-fatal):', e.message);
  }
}

startServer().catch(err => {
  console.error('[FATAL] Unexpected server error:', err.message);
  process.exit(1);
});

