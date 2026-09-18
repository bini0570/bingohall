const { all } = require('./src/db');
(async () => {
  try {
    const deposits = await all("SELECT * FROM deposits ORDER BY id DESC LIMIT 5");
    console.log("Recent Deposits:", deposits);
  } catch(e) {
    console.error(e);
  }
})();
