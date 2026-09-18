require('dotenv').config();
(async () => {
  try {
    const url = process.env.SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Tasks Columns:', Object.keys(data.definitions.tasks.properties));
    console.log('Promo_codes Columns:', Object.keys(data.definitions.promo_codes.properties));
  } catch(e) {
    console.error(e);
  }
})();
