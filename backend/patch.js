const fs = require('fs');
let code = fs.readFileSync('src/db.js', 'utf8');

// Replace all for deposits
const depositsAllRegex = /\/\/\s*── DEPOSITS ──.*?(?=\/\/\s*── WITHDRAWALS)/s;
const depositsAllReplacement = // ── DEPOSITS ─────────────────────────────────────────────
    if (sql.includes('FROM deposits')) {
      let data = [];
      if (sql.includes('WHERE user_id = ?')) {
        const { data: u } = await supabase.from('users').select('telegram_id').eq('id', params[0]).single();
        if (u && u.telegram_id) {
          const res = await supabase.from('deposits').select('*').eq('telegram_id', u.telegram_id).order('created_at', { ascending: false });
          data = res.data || [];
        }
      } else if (sql.includes("status = 'pending'") || sql.includes('status = \\'pending\\'')) {
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

    ;
code = code.replace(depositsAllRegex, depositsAllReplacement);

// Replace all for withdrawals
const withdrawalsAllRegex = /\/\/\s*── WITHDRAWALS ──.*?(?=\/\/\s*── GAME SETTINGS)/s;
const withdrawalsAllReplacement = // ── WITHDRAWALS ──────────────────────────────────────────
    if (sql.includes('FROM withdrawals')) {
      let data = [];
      if (sql.includes('WHERE user_id = ?')) {
        const { data: u } = await supabase.from('users').select('telegram_id').eq('id', params[0]).single();
        if (u && u.telegram_id) {
          const res = await supabase.from('withdrawals').select('*').eq('telegram_id', u.telegram_id).order('created_at', { ascending: false });
          data = res.data || [];
        }
      } else if (sql.includes("status = 'pending'") || sql.includes('status = \\'pending\\'')) {
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

    ;
code = code.replace(withdrawalsAllRegex, withdrawalsAllReplacement);

// Fix INSERTS
const insertDepRegex = /\/\/\s*── INSERT DEPOSIT ──.*?(?=\/\/\s*── UPDATE DEPOSIT)/s;
const insertDepRep = // ── INSERT DEPOSIT ───────────────────────────────────────
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

    ;
code = code.replace(insertDepRegex, insertDepRep);

const insertWithRegex = /\/\/\s*── INSERT WITHDRAWAL ──.*?(?=\/\/\s*── UPDATE WITHDRAWAL STATUS)/s;
const insertWithRep = // ── INSERT WITHDRAWAL ────────────────────────────────────
    if (sql.includes('INSERT INTO withdrawals')) {
      const [user_id, username, phone, method, account_number, amount, status] = params;
      const { data: u } = await supabase.from('users').select('telegram_id').eq('id', user_id).single();
      const { data, error } = await supabase.from('withdrawals').insert({
        telegram_id: u?.telegram_id || String(user_id),
        method, account_number,
        amount: parseFloat(amount),
        status: status || 'pending'
      }).select('id').single();
      if (error) throw new Error(error.message);
      return { lastID: data.id };
    }

    ;
code = code.replace(insertWithRegex, insertWithRep);

fs.writeFileSync('src/db.js', code);
console.log('db.js updated successfully!');
