// ============================================================
// db.js — Supabase PostgreSQL Database Layer
// Replaces the old JSON-file + string-matching fake SQL
// All exports (initDB, run, get, all) preserved for compatibility
// ============================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[DB] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

console.log('[DB] Connected to Supabase PostgreSQL');

// ─────────────────────────────────────────────────────────────
// initDB — seed admin + default settings on first run
// ─────────────────────────────────────────────────────────────
async function initDB() {
  try {
    // ── Auto-migrate: ensure all required columns exist ──────────
    const migrations = [
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS ticket_price NUMERIC DEFAULT 10`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS total_tickets INTEGER DEFAULT 0`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS prize_pool NUMERIC DEFAULT 0`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS commission_cut NUMERIC DEFAULT 0`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS winner_ids TEXT`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS called_numbers_json TEXT`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS called_numbers TEXT`,
      `ALTER TABLE game_rounds ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COUNTDOWN'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS withdrawable_balance NUMERIC DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS has_deposited SMALLINT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned SMALLINT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id TEXT`,
      `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS account_name TEXT`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        type TEXT,
        title TEXT,
        telegram_link TEXT,
        button_name TEXT,
        reward NUMERIC,
        target TEXT DEFAULT 'All Players',
        status TEXT DEFAULT 'active',
        claim_count INTEGER DEFAULT 0,
        required_invites INTEGER DEFAULT 5,
        required_games INTEGER DEFAULT 10,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_invites INTEGER DEFAULT 5;`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS required_games INTEGER DEFAULT 10;`,
      `CREATE TABLE IF NOT EXISTS promos (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        reward NUMERIC NOT NULL,
        usage_limit INTEGER DEFAULT -1,
        used_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ];

    for (const sql of migrations) {
      try {
        await supabase.rpc('exec_sql', { sql });
      } catch (err) {
        // ignore
      }
    }

    // Ensure default game settings exist
    const defaults = [
      { key: 'ticket_price',        value: '10' },
      { key: 'commission_pct',      value: '20' },
      { key: 'countdown_sec',       value: '40' },
      { key: 'draw_speed_sec',      value: '3'  },
      { key: 'referral_reward_etb', value: '10' },
      { key: 'auto_start',          value: 'true' }
    ];
    for (const s of defaults) {
      await supabase.from('game_settings').upsert(s, { onConflict: 'key', ignoreDuplicates: true });
    }

    // Create admin user if not exists
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = 'Lifestar@2!'; // Forced exactly as requested
    const adminPhone    = process.env.ADMIN_PHONE    || '0911000000';

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', adminUsername)
      .single();

    if (!existing) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await supabase.from('users').insert({
        username:     adminUsername,
        phone:        adminPhone,
        password_hash: hash,
        first_name:   'Admin',
        telegram_id:  'admin_' + Date.now(), // Dummy ID to satisfy not-null constraint
        balance:      1000.00,
        referral_code: 'ADMIN00',
        is_admin:     1,
        is_banned:    0
      });
      console.log(`[DB] Admin user "${adminUsername}" created.`);
    } else {
      // Always sync admin password from env (so changing .env updates it)
      const hash = await bcrypt.hash(adminPassword, 10);
      await supabase.from('users').update({ password_hash: hash }).eq('username', adminUsername);
    }

    console.log('[DB] Database initialized successfully.');
  } catch (err) {
    console.error('[DB] initDB error:', err.message);
  }
}


// ─────────────────────────────────────────────────────────────
// get(sql, params) — returns first matching row or null
// We parse the SQL string to dispatch to the right Supabase call
// ─────────────────────────────────────────────────────────────
async function get(sql, params = []) {
  sql = sql.trim();
  try {

    // ── USERS ────────────────────────────────────────────────
    if (sql.includes('FROM users')) {

      if (sql.includes('WHERE username = ? OR phone = ?')) {
        const [val1, val2] = params;
        const { data } = await supabase.from('users').select('*')
          .or(`username.eq.${val1},phone.eq.${val2 || val1}`).limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('WHERE telegram_id = ? OR phone = ?')) {
        const { data: d1 } = await supabase.from('users').select('*').eq('telegram_id', String(params[0])).limit(1);
        if (d1?.[0]) return d1[0];
        const { data: d2 } = await supabase.from('users').select('*').eq('phone', String(params[1])).limit(1);
        return d2?.[0] || null;
      }
      if (sql.includes('WHERE username = ?')) {
        const { data } = await supabase.from('users').select('*').eq('username', params[0]).limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('WHERE phone = ?')) {
        const { data } = await supabase.from('users').select('*').eq('phone', params[0]).limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('WHERE telegram_id = ?')) {
        const { data } = await supabase.from('users').select('*').eq('telegram_id', String(params[0])).limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('WHERE referral_code = ?')) {
        const { data } = await supabase.from('users').select('*').eq('referral_code', params[0]).limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('WHERE id = ?')) {
        const { data } = await supabase.from('users').select('*').eq('id', params[0]).limit(1);
        return data?.[0] || null;
      }
      // COUNT queries
      if (sql.includes('COUNT(*) as count')) {
        const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        return { count: count || 0 };
      }
    }

    // ── GAME SETTINGS ────────────────────────────────────────
    if (sql.includes('FROM game_settings')) {
      if (params[0]) {
        const { data } = await supabase.from('game_settings').select('*').eq('key', params[0]).limit(1);
        return data?.[0] || null;
      }
    }

    // ── DEPOSITS ─────────────────────────────────────────────
    if (sql.includes('FROM deposits')) {
      if (sql.includes('WHERE id = ?')) {
        const { data } = await supabase.from('deposits').select('*').eq('id', params[0]).limit(1);
        if (!data || !data[0]) return null;
        const d = data[0];
        const { data: u } = await supabase.from('users').select('id, username, phone').eq('telegram_id', d.telegram_id).single();
        return { ...d, user_id: u?.id || null, username: u?.username || 'Unknown', phone: u?.phone || 'Unknown', receipt_sms: d.sms_text };
      }
      if (sql.includes('SUM(amount) as sum')) {
        const { data } = await supabase.from('deposits').select('amount').eq('status', 'approved');
        const sum = (data || []).reduce((a, d) => a + (parseFloat(d.amount) || 0), 0);
        return { sum };
      }
    }

    // ── WITHDRAWALS ──────────────────────────────────────────
    if (sql.includes('FROM withdrawals')) {
      if (sql.includes('WHERE id = ?')) {
        const { data } = await supabase.from('withdrawals').select('*').eq('id', params[0]).limit(1);
        if (!data || !data[0]) return null;
        const d = data[0];
        const { data: u } = await supabase.from('users').select('id, username, phone').eq('telegram_id', d.telegram_id).single();
        return { ...d, user_id: u?.id || null, username: u?.username || 'Unknown', phone: u?.phone || 'Unknown' };
      }
      if (sql.includes('SUM(amount) as sum')) {
        const { data } = await supabase.from('withdrawals').select('amount').eq('status', 'approved');
        const sum = (data || []).reduce((a, w) => a + (parseFloat(w.amount) || 0), 0);
        return { sum };
      }
    }

    // ── REFERRALS ────────────────────────────────────────────
    if (sql.includes('FROM referrals')) {
      if (sql.includes("status = 'pending'")) {
        const { data } = await supabase.from('referrals').select('*')
          .eq('referee_id', params[0]).eq('status', 'pending').limit(1);
        return data?.[0] || null;
      }
      if (sql.includes('SUM(reward_amount) as total')) {
        const { data } = await supabase.from('referrals').select('reward_amount')
          .eq('referrer_id', params[0]).eq('status', 'qualified');
        const total = (data || []).reduce((a, r) => a + (parseFloat(r.reward_amount) || 0), 0);
        return { total };
      }
    }

    // ── TICKETS COUNT ─────────────────────────────────────────
    if (sql.includes('COUNT(*) as count FROM tickets')) {
      const { count } = await supabase.from('tickets').select('*', { count: 'exact', head: true })
        .eq('user_id', params[0]);
      return { count: count || 0 };
    }

    // ── GAME ROUNDS COUNT / SUM ───────────────────────────────
    if (sql.includes('COUNT(*) as count FROM game_rounds')) {
      if (sql.includes('winner_ids LIKE ?')) {
        // Check wins — fetch rounds and filter in memory (LIKE not natively available via supabase-js filter for this)
        const userIdStr = String(params[0]).replace(/%/g, '');
        const { data } = await supabase.from('game_rounds').select('winner_ids').not('winner_ids', 'is', null);
        const won = (data || []).filter(g => {
          try {
            const ids = typeof g.winner_ids === 'string' ? JSON.parse(g.winner_ids) : g.winner_ids;
            if (Array.isArray(ids)) return ids.some(w => String(w.userId || w) === userIdStr);
          } catch {}
          return String(g.winner_ids).includes(userIdStr);
        });
        return { count: won.length };
      }
      const { count } = await supabase.from('game_rounds').select('*', { count: 'exact', head: true });
      return { count: count || 0 };
    }

    if (sql.includes('SUM(total_tickets) as sum, SUM(commission_cut) as comm FROM game_rounds')) {
      const { data } = await supabase.from('game_rounds').select('commission_cut');
      const comm = (data || []).reduce((a, g) => a + (parseFloat(g.commission_cut) || 0), 0);
      return { comm };
    }

    if (sql.includes('FROM game_rounds WHERE status IN') || sql.includes('FROM game_rounds WHERE status =')) {
      const { data } = await supabase.from('game_rounds').select('*')
        .in('status', ['COUNTDOWN', 'DRAWING', 'WAITING'])
        .order('id', { ascending: false }).limit(1);
      return data?.[0] || null;
    }

  } catch (err) {
    console.error('[DB] get() error:', err.message, '| SQL:', sql.slice(0, 80));
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// all(sql, params) — returns array of rows
// ─────────────────────────────────────────────────────────────
async function all(sql, params = []) {
  sql = sql.trim();
  try {

    // ── USERS ────────────────────────────────────────────────
    if (sql.includes('FROM users')) {
      if (sql.includes('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL')) {
        const { data } = await supabase.from('users').select('telegram_id').not('telegram_id', 'is', null);
        return data || [];
      }
      const { data } = await supabase.from('users')
        .select('id, username, phone, balance, referral_code, is_banned, is_admin, telegram_id, created_at')
        .order('id', { ascending: false });
      return data || [];
    }

    // ── DEPOSITS ─────────────────────────────────────────────
    if (sql.includes('FROM deposits')) {
      let data = [];
      if (sql.includes('WHERE user_id = ?')) {
        const { data: u } = await supabase.from('users').select('telegram_id').eq('id', params[0]).single();
        if (u && u.telegram_id) {
          const res = await supabase.from('deposits').select('*').eq('telegram_id', u.telegram_id).order('created_at', { ascending: false });
          data = res.data || [];
        }
      } else if (sql.includes("status = 'pending'") || sql.includes('status = \'pending\'')) {
        const res = await supabase.from('deposits').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        data = res.data || [];
      } else {
        const res = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
        data = res.data || [];
      }
      
      const { data: users } = await supabase.from('users').select('id, telegram_id, username, phone');
      const userMap = {};
      users?.forEach(u => { if (u.telegram_id) userMap[u.telegram_id] = u; });

      return data.map(d => ({
        ...d,
        user_id: userMap[d.telegram_id]?.id || null,
        username: userMap[d.telegram_id]?.username || 'Unknown',
        phone: userMap[d.telegram_id]?.phone || 'Unknown',
        receipt_sms: d.sms_text
      })).sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
    }

    // ── WITHDRAWALS ──────────────────────────────────────────
    if (sql.includes('FROM withdrawals')) {
      let data = [];
      if (sql.includes('WHERE user_id = ?')) {
        const { data: u } = await supabase.from('users').select('telegram_id').eq('id', params[0]).single();
        if (u && u.telegram_id) {
          const res = await supabase.from('withdrawals').select('*').eq('telegram_id', u.telegram_id).order('created_at', { ascending: false });
          data = res.data || [];
        }
      } else if (sql.includes("status = 'pending'") || sql.includes('status = \'pending\'')) {
        const res = await supabase.from('withdrawals').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        data = res.data || [];
      } else {
        const res = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
        data = res.data || [];
      }
      
      const { data: users } = await supabase.from('users').select('id, telegram_id, username, phone');
      const userMap = {};
      users?.forEach(u => { if (u.telegram_id) userMap[u.telegram_id] = u; });

      return data.map(d => ({
        ...d,
        user_id: userMap[d.telegram_id]?.id || null,
        username: userMap[d.telegram_id]?.username || 'Unknown',
        phone: userMap[d.telegram_id]?.phone || 'Unknown'
      })).sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
    }

    // ── GAME SETTINGS ────────────────────────────────────────
    if (sql.includes('FROM game_settings')) {
      const { data } = await supabase.from('game_settings').select('*');
      return data || [];
    }

    // ── REFERRALS ────────────────────────────────────────────
    if (sql.includes('FROM referrals')) {
      const { data: refs } = await supabase.from('referrals').select('*')
        .eq('referrer_id', params[0]).order('id', { ascending: false });
      if (!refs) return [];
      // Join user info
      const result = await Promise.all((refs).map(async (r) => {
        const { data: referee } = await supabase.from('users').select('username, created_at').eq('id', r.referee_id).limit(1);
        return {
          ...r,
          referee_name: referee?.[0]?.username || 'User',
          joined_at: referee?.[0]?.created_at || r.created_at
        };
      }));
      return result;
    }

    // ── TICKETS ──────────────────────────────────────────────
    if (sql.includes('FROM tickets')) {
      if (sql.includes('WHERE round_id = ?')) {
        const { data } = await supabase.from('tickets').select('*').eq('round_id', params[0]);
        return data || [];
      }
    }

  } catch (err) {
    console.error('[DB] all() error:', err.message, '| SQL:', sql.slice(0, 80));
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// run(sql, params) — INSERT / UPDATE operations
// Returns { lastID } for inserts, { changes } for updates
// ─────────────────────────────────────────────────────────────
async function run(sql, params = []) {
  sql = sql.trim();
  try {

    // ── INSERT USER ──────────────────────────────────────────
    if (sql.includes('INSERT INTO users')) {
      const [username, phone, password_hash, referral_code, referred_by, telegram_id] = params;
      const basePayload = {
        username,
        phone,
        password_hash,
        referral_code,
        referred_by: referred_by || null,
        telegram_id: telegram_id ? String(telegram_id) : null,
        first_name: username || 'User', // Fix for first_name not-null constraint
        balance: 20.0,
        is_admin: 0,
        is_banned: 0
      };

      const { data, error } = await supabase.from('users').insert(basePayload).select('*').single();
      if (error) {
        console.error('[DB] insert user error:', error.message);
        throw new Error(error.message);
      }
      return { lastID: data.id, user: data };
    }

    // ── UPDATE telegram_id + balance ADD WHERE id ────────────
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('balance = balance + ?') && sql.includes('WHERE id = ?')) {
      const { data: u } = await supabase.from('users').select('balance').eq('id', params[2]).single();
      const newBal = (parseFloat(u?.balance) || 0) + parseFloat(params[1]);
      await supabase.from('users').update({ telegram_id: String(params[0]), balance: newBal }).eq('id', params[2]);
      return { changes: 1 };
    }

    // ── UPDATE telegram_id + phone + username WHERE id ───────
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('phone = ?') && sql.includes('username = ?') && sql.includes('WHERE id = ?')) {
      await supabase.from('users').update({
        telegram_id: String(params[0]),
        phone: String(params[1]),
        username: String(params[2])
      }).eq('id', params[3]);
      return { changes: 1 };
    }

    // ── UPDATE telegram_id + phone WHERE id ─────────────────
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('phone = ?') && sql.includes('WHERE id = ?')) {
      await supabase.from('users').update({ telegram_id: String(params[0]), phone: String(params[1]) }).eq('id', params[2]);
      return { changes: 1 };
    }

    // ── UPDATE telegram_id WHERE username (admin link) ───────
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('is_admin = 1')) {
      await supabase.from('users').update({ telegram_id: String(params[0]), is_admin: 1 }).eq('username', params[1]);
      return { changes: 1 };
    }
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('WHERE username =')) {
      await supabase.from('users').update({ telegram_id: String(params[0]) }).eq('username', params[1]);
      return { changes: 1 };
    }

    // ── UPDATE telegram_id WHERE id ──────────────────────────
    if (sql.includes('UPDATE users SET telegram_id = ?') && sql.includes('WHERE id = ?')) {
      await supabase.from('users').update({ telegram_id: String(params[0]) }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── UPDATE PASSWORD ──────────────────────────────────────
    if (sql.includes('UPDATE users SET password_hash = ? WHERE id = ?')) {
      await supabase.from('users').update({ password_hash: String(params[0]) }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── BALANCE ADD ──────────────────────────────────────────
    if (sql.includes('UPDATE users SET balance = balance + ? WHERE id = ?')) {
      const { data: u } = await supabase.from('users').select('balance').eq('id', params[1]).single();
      const newBal = (parseFloat(u?.balance) || 0) + parseFloat(params[0]);
      await supabase.from('users').update({ balance: newBal }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── BALANCE DEDUCT ───────────────────────────────────────
    if (sql.includes('UPDATE users SET balance = balance - ? WHERE id = ?')) {
      const { data: u } = await supabase.from('users').select('balance').eq('id', params[1]).single();
      const newBal = Math.max(0, (parseFloat(u?.balance) || 0) - parseFloat(params[0]));
      await supabase.from('users').update({ balance: newBal }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── BALANCE SET ──────────────────────────────────────────
    if (sql.includes('UPDATE users SET balance = ?, withdrawable_balance = ? WHERE id = ?')) {
      await supabase.from('users').update({ balance: parseFloat(params[0]), withdrawable_balance: parseFloat(params[1]) }).eq('id', params[2]);
      return { changes: 1 };
    }
    
    if (sql.includes('UPDATE users SET balance = ? WHERE id = ?')) {
      await supabase.from('users').update({ balance: parseFloat(params[0]) }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── WITHDRAWABLE ADD ─────────────────────────────────────
    if (sql.includes('UPDATE users SET withdrawable_balance = withdrawable_balance + ? WHERE id = ?')) {
      try {
        const { data: u } = await supabase.from('users').select('withdrawable_balance').eq('id', params[1]).single();
        const newBal = (parseFloat(u?.withdrawable_balance) || 0) + parseFloat(params[0]);
        await supabase.from('users').update({ withdrawable_balance: newBal }).eq('id', params[1]);
      } catch (e) {
        console.warn('[DB] withdrawable_balance column update skipped:', e.message);
      }
      return { changes: 1 };
    }

    // ── WITHDRAWABLE DEDUCT ──────────────────────────────────
    if (sql.includes('UPDATE users SET withdrawable_balance = withdrawable_balance - ? WHERE id = ?')) {
      try {
        const { data: u } = await supabase.from('users').select('withdrawable_balance').eq('id', params[1]).single();
        const newBal = Math.max(0, (parseFloat(u?.withdrawable_balance) || 0) - parseFloat(params[0]));
        await supabase.from('users').update({ withdrawable_balance: newBal }).eq('id', params[1]);
      } catch (e) {
        console.warn('[DB] withdrawable_balance column update skipped:', e.message);
      }
      return { changes: 1 };
    }

    // ── HAS_DEPOSITED FLAG ───────────────────────────────────
    if (sql.includes('UPDATE users SET has_deposited = 1 WHERE id = ?')) {
      try {
        await supabase.from('users').update({ has_deposited: 1 }).eq('id', params[0]);
      } catch (e) {
        console.warn('[DB] has_deposited column update skipped:', e.message);
      }
      return { changes: 1 };
    }

    // ── IS_ADMIN FLAG ────────────────────────────────────────
    if (sql.includes('UPDATE users SET is_admin = 1 WHERE id = ?')) {
      await supabase.from('users').update({ is_admin: 1 }).eq('id', params[0]);
      return { changes: 1 };
    }

    // ── UPDATE GAME ROUNDS ───────────────────────────────────
    if (sql.includes('UPDATE game_rounds SET')) {
      if (sql.includes('called_numbers_json = ?')) {
        await supabase.from('game_rounds').update({ called_numbers_json: String(params[0]) }).eq('id', params[1]);
        return { changes: 1 };
      }
      if (sql.includes('status = ?') && sql.includes('WHERE id = ?')) {
        await supabase.from('game_rounds').update({ status: String(params[0]) }).eq('id', params[1]);
        return { changes: 1 };
      }
    }

    // ── BAN / UNBAN ──────────────────────────────────────────
    if (sql.includes('UPDATE users SET is_banned = ? WHERE id = ?')) {
      await supabase.from('users').update({ is_banned: parseInt(params[0]) }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── INSERT DEPOSIT ───────────────────────────────────────
    if (sql.includes('INSERT INTO deposits')) {
      const [user_id, username, phone, method, amount, proof_image, receipt_sms, status] = params;
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single();
      const { data, error } = await supabase.from('deposits').insert({
        telegram_id: u?.telegram_id || String(user_id),
        method,
        amount: parseFloat(amount),
        sms_text: receipt_sms,
        status: status || 'pending'
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    // ── UPDATE DEPOSIT STATUS ────────────────────────────────
    if (sql.includes('UPDATE deposits SET status = ? WHERE id = ?')) {
      await supabase.from('deposits').update({ status: params[0] }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── INSERT WITHDRAWAL ────────────────────────────────────
    if (sql.includes('INSERT INTO withdrawals')) {
      const [user_id, username, phone, method, account_number, amount, status] = params;
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single();
      const { data, error } = await supabase.from('withdrawals').insert({
        telegram_id: u?.telegram_id || String(user_id),
        method, 
        account_number,
        amount: parseFloat(amount),
        status: status || 'pending'
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    // ── UPDATE WITHDRAWAL STATUS ─────────────────────────────
    if (sql.includes('UPDATE withdrawals SET status = ? WHERE id = ?')) {
      await supabase.from('withdrawals').update({ status: params[0] }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── UPDATE WITHDRAWAL ACCOUNT NAME ───────────────────────
    if (sql.includes('UPDATE withdrawals SET account_name = ? WHERE id = ?')) {
      await supabase.from('withdrawals').update({ account_name: params[0] }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── INSERT GAME ROUND ────────────────────────────────────
    if (sql.includes('INSERT INTO game_rounds')) {
      const [status, ticket_price, total_tickets, prize_pool, commission_cut] = params;
      const { data, error } = await supabase.from('game_rounds').insert({
        status, ticket_price: parseFloat(ticket_price),
        total_tickets: parseInt(total_tickets),
        prize_pool: parseFloat(prize_pool),
        commission_cut: parseFloat(commission_cut)
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    // ── UPDATE GAME ROUND totals ─────────────────────────────
    if (sql.includes('UPDATE game_rounds SET total_tickets = ?, prize_pool = ?, commission_cut = ? WHERE id = ?')) {
      await supabase.from('game_rounds').update({
        total_tickets:  parseInt(params[0]),
        prize_pool:     parseFloat(params[1]),
        commission_cut: parseFloat(params[2])
      }).eq('id', params[3]);
      return { changes: 1 };
    }

    // ── UPDATE GAME ROUND status ─────────────────────────────
    if (sql.includes("UPDATE game_rounds SET status = 'DRAWING' WHERE id = ?")) {
      await supabase.from('game_rounds').update({ status: 'DRAWING' }).eq('id', params[0]);
      return { changes: 1 };
    }
    if (sql.includes('UPDATE game_rounds SET status = ? WHERE id = ?')) {
      await supabase.from('game_rounds').update({ status: params[0] }).eq('id', params[1]);
      return { changes: 1 };
    }

    // ── UPDATE GAME ROUND ENDED ──────────────────────────────
    if (sql.includes("UPDATE game_rounds SET status = 'ENDED'")) {
      await supabase.from('game_rounds').update({
        status:         'ENDED',
        winner_ids:     params[0],
        called_numbers: params[1]
      }).eq('id', params[2]);
      return { changes: 1 };
    }

    // ── INSERT TICKET ────────────────────────────────────────
    if (sql.includes('INSERT INTO tickets')) {
      const [round_id, user_id, username, cartella_index, numbers_json] = params;
      const { data, error } = await supabase.from('tickets').insert({
        round_id, user_id, username,
        cartella_index: parseInt(cartella_index),
        numbers_json
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    // ── INSERT REFERRAL ──────────────────────────────────────
    if (sql.includes('INSERT INTO referrals')) {
      const [referrer_id, referee_id, status, reward_amount] = params;
      const { data, error } = await supabase.from('referrals').insert({
        referrer_id, referee_id,
        status: status || 'pending',
        reward_amount: parseFloat(reward_amount || 10)
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    // ── UPDATE REFERRAL STATUS ───────────────────────────────
    if (sql.includes("UPDATE referrals SET status = 'qualified' WHERE id = ?")) {
      await supabase.from('referrals').update({ status: 'qualified' }).eq('id', params[0]);
      return { changes: 1 };
    }
    
    if (sql.includes("UPDATE referrals SET status = 'completed' WHERE referrer_id = ? AND referee_id = ?")) {
      await supabase.from('referrals').update({ status: 'completed' }).eq('referrer_id', params[0]).eq('referee_id', params[1]);
      return { changes: 1 };
    }

    // ── UPSERT GAME SETTINGS ─────────────────────────────────
    if (sql.includes('INSERT INTO game_settings')) {
      const [key, value] = params;
      await supabase.from('game_settings').upsert({ key, value: String(value) }, { onConflict: 'key' });
      return { changes: 1 };
    }

  } catch (err) {
    console.error('[DB] run() error:', err.message, '| SQL:', sql.slice(0, 80));
  }
  return { changes: 0 };
}

module.exports = { initDB, run, get, all, supabase };
