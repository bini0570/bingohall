const { run } = require('./src/db');
(async () => {
  try {
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('telebirr_name', 'Biniyam')");
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('telebirr_number', '0979827836')");
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('cbebirr_name', 'Biniyam')");
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('cbebirr_number', '0979827836')");
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('cbe_name', 'Biniyam')");
    await run("INSERT OR REPLACE INTO game_settings (key, value) VALUES ('cbe_number', '0979827836')");
    console.log("Database updated!");
  } catch(e) {
    console.error(e);
  }
})();
