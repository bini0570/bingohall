const fs = require('fs');

let code = fs.readFileSync('backend/src/telegramBot.js', 'utf8');

// 1. Remove ADMIN_TELEGRAM_ID and ADMIN_BOT_TOKEN
code = code.replace(/const ADMIN_BOT_TOKEN = process\.env\.TELEGRAM_ADMIN_BOT_TOKEN \|\| null;\n/, '');
code = code.replace(/const ADMIN_TELEGRAM_ID = process\.env\.ADMIN_TELEGRAM_ID \|\| '7768666075';\n/, '');

// 2. Remove Admin Bot initialization
code = code.replace(/\/\/ Separate Admin Bot initialization if dedicated token provided[\s\S]*?\/\/ MAIN START COMMAND/, '// MAIN START COMMAND');

// 3. Update /start command to always send Main Menu
code = code.replace(/      \/\/ Link Admin user if telegramId matches[\s\S]*?      if \(!user \|\| !user\.phone \|\| user\.phone\.startsWith\('tg_'\)\) \{/m, '      if (!user || !user.phone || user.phone.startsWith(\'tg_\')) {');
code = code.replace(/      \/\/ Route: admin gets admin dashboard, normal user gets player menu[\s\S]*?        sendMainMenu\(chatId, user\);\n      \}/m, '      sendMainMenu(chatId, user);');

// 4. Remove /admin command completely
code = code.replace(/    \/\/ ADMIN COMMAND.*?bot\.onText\(\/\\\/admin[^\n]*\n(?:[ \t]*.*?\n)*?    \}\);\n/sm, '');

// 5. Update contact handler to remove admin check
code = code.replace(/      const isAdminContact = telegramId === ADMIN_TELEGRAM_ID[\s\S]*?      \} else \{/m, '');
code = code.replace(/      \}\n    \}\);\n\n    \/\/ BALANCE COMMAND/m, '    });\n\n    // BALANCE COMMAND');
code = code.replace(/bot\.sendMessage\(chatId, homepageMsg, \{[\s\S]*?\}\);/m, 'bot.sendMessage(chatId, homepageMsg, {\n          parse_mode: \'HTML\',\n          reply_markup: getMainReplyKeyboard()\n        });');

// 6. Update callback_query to remove admin handling
code = code.replace(/      const dbUser = await get.*?if \(isAdmin && data\.startsWith\('adm_'\)\) \{[\s\S]*?return;\n      \}/sm, '');

// 7. Update text message handler to remove admin broadcast
code = code.replace(/      if \(state\.action === 'awaiting_broadcast'\) \{[\s\S]*?return;\n      \}/m, '');

// 8. Make notification functions empty (so server.js doesn't break if it imports them)
code = code.replace(/function notifyAdminNewDeposit[\s\S]*?catch\(e => console\.error\('\[Telegram Bot\] Admin deposit notification error:', e\.message\)\);\n\}/m, 'function notifyAdminNewDeposit(deposit) {}');
code = code.replace(/function notifyAdminNewWithdrawal[\s\S]*?catch\(e => console\.error\('\[Telegram Bot\] Admin withdrawal notification error:', e\.message\)\);\n\}/m, 'function notifyAdminNewWithdrawal(withdrawal) {}');

// 9. Remove sendAdminDashboard, executeAdminBroadcast, handleAdminCallback
code = code.replace(/\/\/ MODERN STREAMLINED TELEGRAM ADMIN SYSTEM[\s\S]*?\/\/ ─────────────────────────────────────────────────────────────/m, '// ─────────────────────────────────────────────────────────────');

fs.writeFileSync('backend/src/telegramBot.js', code);
console.log('Done cleaning telegramBot.js');
