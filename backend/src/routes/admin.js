const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// --- TASKS ---
router.get('/tasks', async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/tasks', async (req, res) => {
  const { type, title, telegram_link, button_name, reward, target, required_invites, required_games } = req.body;
  const { data, error } = await supabase.from('tasks').insert([{
    type, title, telegram_link, button_name, reward, target, required_invites, required_games
  }]).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/tasks/:id', async (req, res) => {
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- PROMO CODES ---
router.get('/promos', async (req, res) => {
  const { data, error } = await supabase.from('promo_codes').select('*').order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/promos', async (req, res) => {
  const { code, reward, min_deposit, max_uses, expires_at } = req.body;
  const { data, error } = await supabase.from('promo_codes').insert([{
    code: code.toUpperCase(), reward, min_deposit, max_uses, expires_at
  }]).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/promos/:id', async (req, res) => {
  const { error } = await supabase.from('promo_codes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- TRANSACTIONS LEDGER ---
router.get('/transactions', async (req, res) => {
  const { data, error } = await supabase.from('transactions').select('*').order('id', { ascending: false }).limit(500);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
