const { run, supabase } = require('./src/db');
(async () => {
  try {
    const { data } = await supabase.from('users').select('*').limit(1);
    console.log("Users Columns:", Object.keys(data[0] || {}));
  } catch(e) {
    console.error(e);
  }
})();
