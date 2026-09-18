require('dotenv').config();
const { supabase } = require('./src/db');
(async () => {
  try {
    const url = process.env.SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Deposits Columns:', Object.keys(data.definitions.deposits.properties));
    console.log('Withdrawals Columns:', Object.keys(data.definitions.withdrawals.properties));
  } catch(e) {
    console.error(e);
  }
})();
