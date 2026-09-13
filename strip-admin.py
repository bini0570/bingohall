import re

with open('backend/src/telegramBot.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove ADMIN_TELEGRAM_ID and ADMIN_BOT_TOKEN
code = re.sub(r'const ADMIN_BOT_TOKEN = process\.env\.TELEGRAM_ADMIN_BOT_TOKEN \|\| null;\n', '', code)
code = re.sub(r'const ADMIN_TELEGRAM_ID = process\.env\.ADMIN_TELEGRAM_ID \|\| \'7768666075\';\n', '', code)

# 2. Remove Admin Bot initialization
code = re.sub(r'// Separate Admin Bot initialization if dedicated token provided.*?// MAIN START COMMAND', '// MAIN START COMMAND', code, flags=re.DOTALL)

# 3. Update /start command to always send Main Menu
code = re.sub(r'      // Link Admin user if telegramId matches.*?      if \(!user \|\| !user\.phone \|\| user\.phone\.startsWith\(\'tg_\'\)\) \{', '      if (!user || !user.phone || user.phone.startsWith(\'tg_\')) {', code, flags=re.DOTALL)
code = re.sub(r'      // Route: admin gets admin dashboard, normal user gets player menu.*?        sendMainMenu\(chatId, user\);\n      \}', '      sendMainMenu(chatId, user);', code, flags=re.DOTALL)

# 4. Remove /admin command completely
code = re.sub(r'    // ADMIN COMMAND.*?bot\.onText\(\/\\/admin[^\n]*\n(?:[ \t]*.*?\n)*?    \}\);\n', '', code, flags=re.DOTALL)

# 5. Update contact handler to remove admin check
code = re.sub(r'      const isAdminContact = telegramId === ADMIN_TELEGRAM_ID.*?      \} else \{', '', code, flags=re.DOTALL)
code = re.sub(r'      \}\n    \}\);\n\n    // BALANCE COMMAND', '    });\n\n    // BALANCE COMMAND', code)
code = re.sub(r'bot\.sendMessage\(chatId, homepageMsg, \{.*?\}\);', 'bot.sendMessage(chatId, homepageMsg, {\n          parse_mode: \'HTML\',\n          reply_markup: getMainReplyKeyboard()\n        });', code, flags=re.DOTALL)

# 6. Update callback_query to remove admin handling
code = re.sub(r'      const dbUser = await get.*?if \(isAdmin && data\.startsWith\(\'adm_\'\)\) \{.*?return;\n      \}', '', code, flags=re.DOTALL)

# 7. Update text message handler to remove admin broadcast
code = re.sub(r'      if \(state\.action === \'awaiting_broadcast\'\) \{.*?return;\n      \}', '', code, flags=re.DOTALL)

# 8. Empty notification functions
code = re.sub(r'function notifyAdminNewDeposit.*?catch\(e => console\.error\(\'\[Telegram Bot\] Admin deposit notification error:\', e\.message\)\);\n\}', 'function notifyAdminNewDeposit(deposit) {}', code, flags=re.DOTALL)
code = re.sub(r'function notifyAdminNewWithdrawal.*?catch\(e => console\.error\(\'\[Telegram Bot\] Admin withdrawal notification error:\', e\.message\)\);\n\}', 'function notifyAdminNewWithdrawal(withdrawal) {}', code, flags=re.DOTALL)

# 9. Remove sendAdminDashboard, executeAdminBroadcast, handleAdminCallback
code = re.sub(r'// MODERN STREAMLINED TELEGRAM ADMIN SYSTEM.*?// ─────────────────────────────────────────────────────────────', '// ─────────────────────────────────────────────────────────────', code, flags=re.DOTALL)

with open('backend/src/telegramBot.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done cleaning telegramBot.js")
