// supabase.js — re-exports the Supabase client from db.js
// Firebase has been fully removed. Supabase is the only database.
const { supabase } = require('./db');

function isSupabaseConfigured() {
  return !!supabase;
}

module.exports = { supabase, isSupabaseConfigured };
