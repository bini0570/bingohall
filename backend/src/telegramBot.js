let TelegramBot = null;
try {
  const pkg = require('node-telegram-bot-api');
  // node-telegram-bot-api exports the class directly in CommonJS
  TelegramBot = typeof pkg === 'function' ? pkg : (pkg.default && typeof pkg.default === 'function' ? pkg.default : null);
  if (!TelegramBot) console.log('[Telegram Bot] Could not resolve TelegramBot constructor.');
} catch (e) {
  console.log('[Telegram Bot] node-telegram-bot-api not installed. Running in standalone mode.');
}

const { get, all, run } = require('./db');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8933892491:AAFafN2fystn8Ixeu89J5Xp162I6MK5zPcQ';
const WEB_APP_URL = (process.env.WEB_APP_URL || 'https://bingohall.vercel.app').replace(/\/$/, '');

// Helper to escape HTML tags in user-generated strings
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Telegram requires HTTPS for web_app buttons, and rejects localhost URLs for url: buttons.
const isHttps = WEB_APP_URL.startsWith('https://');

// Play button — web_app if HTTPS, callback button if on HTTP/localhost
function getPlayButton() {
  if (isHttps) {
    return { text: '🎮 PLAY BINGO', web_app: { url: WEB_APP_URL } };
  }
  return { text: '🎮 PLAY BINGO', callback_data: 'cb_play' };
}

function getAdminPanelButton() {
  const adminUrl = WEB_APP_URL.includes('?') ? `${WEB_APP_URL}&view=admin` : `${WEB_APP_URL}?view=admin`;
  // Always use plain URL (never web_app) so admin bot's initData doesn't conflict
  // with the player bot token validation on the backend.
  return { text: '🌐 Open Admin Panel', url: adminUrl };
}

let bot = null;
let adminBotInstance = null;
const userStates = {};

function initTelegramBot(ioInstance) {
  if (!TelegramBot || !BOT_TOKEN || BOT_TOKEN === 'MOCK_BOT_TOKEN') {
    console.log('[Telegram Bot] Running in companion mode (no active bot token required).');
    return;
  }

  try {
    bot = new TelegramBot(BOT_TOKEN, {
      polling: {
        interval: 300,
        autoStart: true,
        params: { timeout: 10 }
      }
    });

    bot.on('polling_error', err => {
      if (err.code !== 'EFATAL') return;
      console.error('[Telegram Bot] Polling error:', err.message?.slice(0, 80));
    });
    console.log('[Telegram Bot] User Bot initialized!');
    bot.getMe().then(me => {
      if (me && me.username) bot.botUsername = me.username;
    }).catch(() => {});

    // Catch unhandled TelegramErrors (e.g. invalid URLs on localhost) so they never crash the process
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', (reason) => {
      const msg = reason?.message || String(reason);
      if (msg.includes('ETELEGRAM') || msg.includes('TelegramError')) {
        console.warn('[Telegram Bot] Suppressed unhandled TelegramError:', msg.slice(0, 120));
      } else {
        console.error('[UNHANDLED REJECTION]', msg.slice(0, 200));
      }
    });
    bot.deleteWebhook().then(() => {
      console.log('[Telegram Bot] Webhook cleared successfully for polling.');
    }).catch(e => console.log('[Telegram Bot] deleteWebhook note:', e.message));

    // Do NOT register slash commands — inline buttons only
    // (bot.setMyCommands intentionally omitted)

    // Chat menu button: set to web_app if HTTPS URL configured
    if (isHttps) {
      bot.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: '🎮 Play Bingo',
          web_app: { url: WEB_APP_URL }
        }
      }).catch(() => {});
    } else {
      bot.setChatMenuButton({ menu_button: { type: 'default' } }).catch(() => {});
    }

    // MAIN START COMMAND
    bot.onText(/\/start(?:@\w+)?(.*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);
      delete userStates[chatId];

      const param = (match[1] || '').trim();
      if (param) {
        userStates[chatId] = { referralCode: param };
      }

      let user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);

      if (!user || !user.phone || user.phone.startsWith('tg_')) {
        sendContactRequest(chatId);
        return;
      }

      sendMainMenu(chatId, user);
    });

    // PLAY COMMAND: /play
    bot.onText(/\/play(?:@\w+)?(?:\s+|$)/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);

      let user = await checkUserRegistered(chatId, telegramId);
      if (!user) return;

      sendPlayPrompt(chatId, user);
    });


    // CONTACT SHARE EVENT HANDLER
    bot.on('contact', async msg => {
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);
      const contact = msg.contact;

      if (!contact || !contact.phone_number) {
        bot.sendMessage(chatId, `⚠️ Could not verify phone number. Please try sharing contact again.`);
        return;
      }

      let phone = contact.phone_number.trim();
      if (!phone.startsWith('+') && !phone.startsWith('0')) {
        phone = '+' + phone;
      }

      const profileName = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ');
      const username = profileName || (msg.from.username ? `@${msg.from.username}` : `user_${telegramId}`);
      let user = await get(`SELECT * FROM users WHERE telegram_id = ? OR phone = ?`, [telegramId, phone]);
      let isNewUser = false;

      if (user) {
        await run(`UPDATE users SET telegram_id = ?, phone = ?, username = ? WHERE id = ?`, [telegramId, phone, username, user.id]);
        user = await get(`SELECT * FROM users WHERE id = ?`, [user.id]);
      } else {
        isNewUser = true;
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('tg_user_123', 10);

        const insertResult = await run(
          `INSERT INTO users (username, phone, password_hash, referral_code, referred_by, telegram_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [username, phone, hash, telegramId, null, telegramId]
        );
        if (insertResult) {
          user = insertResult.user || await get(`SELECT * FROM users WHERE id = ?`, [insertResult.lastID]);
        }
        if (!user) {
          user = await get(`SELECT * FROM users WHERE telegram_id = ? OR phone = ?`, [telegramId, phone]);
        }

        if (!user) {
          console.error('[Registration] Failed to create or retrieve user profile in DB.');
          bot.sendMessage(chatId, `⚠️ Registration failed due to database connection issue. Please verify SUPABASE_SERVICE_ROLE_KEY.`);
          delete userStates[chatId];
          return;
        }

        const savedRefCode = userStates[chatId]?.referralCode;
        console.log(`[Referral] New user registered. savedRefCode from state: ${savedRefCode}`);
        if (savedRefCode) {
          const referrer = await get(`SELECT * FROM users WHERE telegram_id = ?`, [savedRefCode]);
          console.log(`[Referral] Referrer lookup result:`, referrer ? `Found: ${referrer.username} (id=${referrer.id})` : 'NOT FOUND');
          if (referrer && referrer.id !== user?.id) {
            await run(`UPDATE users SET balance = balance + 5 WHERE id = ?`, [referrer.id]);
            await run(
              `INSERT INTO referrals (referrer_id, referee_id, status, reward_amount) VALUES (?, ?, 'qualified', 5.0)`,
              [referrer.id, user.id]
            );
            console.log(`[Referral] ✅ Credited 5 ETB to referrer: ${referrer.username}`);
            if (referrer.telegram_id) {
              sendTelegramNotification(
                referrer.telegram_id,
                `🎁 <b>Referral Bonus!</b>\n\n${escapeHTML(username)} joined via your referral link!\n\nYou have been credited <b>5 ETB</b> instantly! 🎉`
              );
            }
          }
        }
      }

      delete userStates[chatId];


        const totalBalance = user ? (parseFloat(user.balance) || 0).toFixed(2) : '20.00';
        const homepageMsg = isNewUser
          ? `🎉 <b>Welcome to Afla Bingo!</b> 🇪🇹\n\n` +
            `👤 <b>Player:</b> <code>${escapeHTML(user.username)}</code>\n` +
            `📱 <b>Phone:</b> <code>${escapeHTML(phone)}</code>\n` +
            `💰 <b>Total Balance:</b> <code>${totalBalance} ETB</code>\n\n` +
            `🎁 <b>Welcome Bonus:</b> +<b>20.00 ETB</b> has been credited to your wallet!`
          : `🇪🇹 <b>Welcome back to Afla Bingo!</b> 🇪🇹\n\n` +
            `👤 <b>Player:</b> <code>${escapeHTML(user.username)}</code>\n` +
            `💰 <b>Total Balance:</b> <code>${totalBalance} ETB</code>`;

        bot.sendMessage(chatId, homepageMsg, {
          parse_mode: 'HTML',
          reply_markup: getMainReplyKeyboard()
        });
    });

    // BALANCE COMMAND
    bot.onText(/\/balance(?:@\w+)?(?:\s+|$)/, async (msg) => {
      const user = await checkUserRegistered(msg.chat.id, String(msg.from.id));
      if (user) sendBalance(msg.chat.id, String(msg.from.id));
    });

    // DEPOSIT COMMAND
    bot.onText(/\/deposit(?:@\w+)?(?:\s+|$)/, async (msg) => {
      if (msg.text && msg.text.match(/\/deposit\s+\d+/)) return; // Handled by fast one-liner
      const user = await checkUserRegistered(msg.chat.id, String(msg.from.id));
      if (user) startDepositFlow(msg.chat.id);
    });

    // WITHDRAW COMMAND
    bot.onText(/\/withdraw(?:@\w+)?(?:\s+|$)/, async (msg) => {
      if (msg.text && msg.text.match(/\/withdraw\s+\d+/)) return; // Handled by fast one-liner
      const user = await checkUserRegistered(msg.chat.id, String(msg.from.id));
      if (user) startWithdrawFlow(msg.chat.id, String(msg.from.id));
    });

    // REFERRAL COMMAND
    bot.onText(/\/referral(?:@\w+)?(?:\s+|$)/, async (msg) => {
      const user = await checkUserRegistered(msg.chat.id, String(msg.from.id));
      if (user) sendReferralInfo(msg.chat.id, String(msg.from.id));
    });

    // HELP COMMAND
    bot.onText(/\/help(?:@\w+)?(?:\s+|$)/, async (msg) => {
      sendHelpInfo(msg.chat.id, String(msg.from.id));
    });

    // FAST ONE-LINE DEPOSIT COMMAND: /deposit <amount> <sms>
    bot.onText(/\/deposit\s+(\d+)\s+(.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);
      const user = await checkUserRegistered(chatId, telegramId);
      if (!user) return;

      const amount = parseFloat(match[1]);
      const smsText = match[2];
      processDeposit(chatId, telegramId, amount, smsText, 'Telebirr/CBE', ioInstance);
    });

    // FAST ONE-LINE WITHDRAW COMMAND: /withdraw <amount> <account>
    bot.onText(/\/withdraw\s+(\d+)\s+(.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);
      const user = await checkUserRegistered(chatId, telegramId);
      if (!user) return;

      const amount = parseFloat(match[1]);
      const accountNum = match[2];
      processWithdrawal(chatId, telegramId, amount, accountNum, 'Telebirr/CBE', ioInstance);
    });

    // INLINE BUTTON CALLBACK QUERIES
    bot.on('callback_query', async query => {
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;
      const telegramId = String(query.from.id);
      const data = query.data;

      try { bot.answerCallbackQuery(query.id); } catch (e) {}



      const user = await checkUserRegistered(chatId, telegramId);
      if (!user) return;

      // Automatically disable inline buttons on old step messages when clicked
      if (data.startsWith('cb_dep_') || data.startsWith('cb_with_')) {
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId }).catch(() => {});
      }

      if (data === 'cb_play') {
        delete userStates[chatId];
        sendPlayPrompt(chatId, user);
      } else if (data === 'cb_balance') {
        delete userStates[chatId];
        sendBalance(chatId, telegramId);
      } else if (data === 'cb_deposit') {
        delete userStates[chatId];
        startDepositFlow(chatId);
      } else if (data === 'cb_withdraw') {
        delete userStates[chatId];
        startWithdrawFlow(chatId, telegramId);
      } else if (data.startsWith('cb_dep_method_')) {
        const method = data.replace('cb_dep_method_', '');
        userStates[chatId] = { action: 'awaiting_deposit_amount', method };
        bot.sendMessage(
          chatId,
          `${''} <b>${escapeHTML(method)} Deposit</b>\n\nTap a quick amount or type how much ETB to deposit:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '100 ETB', callback_data: 'cb_dep_preset_100' },
                  { text: '200 ETB', callback_data: 'cb_dep_preset_200' }
                ],
                [
                  { text: '500 ETB', callback_data: 'cb_dep_preset_500' },
                  { text: '1000 ETB', callback_data: 'cb_dep_preset_1000' }
                ]
              ]
            }
          }
        );
      } else if (data.startsWith('cb_dep_preset_')) {
        const amt = parseFloat(data.replace('cb_dep_preset_', ''));
        // Verify user is in active deposit step
        if (userStates[chatId]?.action !== 'awaiting_deposit_amount') {
          bot.sendMessage(chatId, `⚠️ This prompt has expired. Starting fresh deposit flow...`, { parse_mode: 'HTML' });
          startDepositFlow(chatId);
          return;
        }
        const method = userStates[chatId]?.method || 'Telebirr';
        userStates[chatId] = { action: 'awaiting_deposit_sms', amount: amt, method };
        showBankInfo(chatId, method, amt, ioInstance);
      } else if (data.startsWith('cb_with_preset_')) {
        const amt = parseFloat(data.replace('cb_with_preset_', ''));
        userStates[chatId] = { action: 'awaiting_withdraw_method', amount: amt };
        bot.sendMessage(
          chatId,
          `📤 <b>Withdraw:</b> <code>${amt.toFixed(2)} ETB</code> — Select method:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Telebirr', callback_data: 'cb_with_method_Telebirr' }],
                [{ text: '🏦 CBE Bank', callback_data: 'cb_with_method_CBE' }],
                [{ text: '💳 CBE Birr', callback_data: 'cb_with_method_CBEBirr' }]
              ]
            }
          }
        );
      } else if (data.startsWith('cb_with_method_')) {
        const method = data.replace('cb_with_method_', '');
        // Verify user is in active withdrawal step
        if (userStates[chatId]?.action !== 'awaiting_withdraw_method' || !userStates[chatId]?.amount) {
          bot.sendMessage(chatId, `⚠️ This prompt has expired. Starting fresh withdrawal flow...`, { parse_mode: 'HTML' });
          startWithdrawFlow(chatId, telegramId);
          return;
        }
        const amt = userStates[chatId].amount;
        userStates[chatId] = { action: 'awaiting_withdraw_account', amount: amt, method };
        bot.sendMessage(
          chatId,
          `📤 <b>Withdraw ${amt.toFixed(2)} ETB via ${escapeHTML(method)}</b>\nEnter your account or phone number:`,
          { parse_mode: 'HTML' }
        );
      } else if (data === 'cb_referral') {
        delete userStates[chatId];
        sendReferralInfo(chatId, telegramId);
      } else if (data === 'cb_help') {
        delete userStates[chatId];
        sendHelpInfo(chatId, telegramId);
      }
    });

    // TEXT MESSAGE HANDLER — state machine & persistent bottom menu handler
    bot.on('message', async msg => {
      if (!msg.text) return;
      const chatId = msg.chat.id;
      const telegramId = String(msg.from.id);
      const text = msg.text.trim();
      if (text.startsWith('/')) return; // handled by onText commands

      // Persistent bottom keyboard button handlers
      if (text.includes('PLAY') || text.includes('Play') || text.includes('bingo') || text.includes('Bingo')) {
        delete userStates[chatId];
        const user = await checkUserRegistered(chatId, telegramId);
        if (user) sendPlayPrompt(chatId, user);
        return;
      }
      if (text.includes('Balance') || text.includes('balance')) {
        delete userStates[chatId];
        const user = await checkUserRegistered(chatId, telegramId);
        if (user) sendBalance(chatId, telegramId);
        return;
      }
      if (text.includes('Deposit') || text.includes('deposit')) {
        delete userStates[chatId];
        const user = await checkUserRegistered(chatId, telegramId);
        if (user) startDepositFlow(chatId);
        return;
      }
      if (text.includes('Withdraw') || text.includes('withdraw')) {
        delete userStates[chatId];
        const user = await checkUserRegistered(chatId, telegramId);
        if (user) startWithdrawFlow(chatId, telegramId);
        return;
      }
      if (text.includes('Referral') || text.includes('referral')) {
        delete userStates[chatId];
        const user = await checkUserRegistered(chatId, telegramId);
        if (user) sendReferralInfo(chatId, telegramId);
        return;
      }

      const state = userStates[chatId];
      if (!state) return;



      if (state.action === 'awaiting_deposit_amount') {
        const amt = parseFloat(text);
        if (isNaN(amt) || amt <= 0) {
          bot.sendMessage(chatId, `⚠️ Please enter a valid deposit amount in numbers (e.g. 100).`);
          return;
        }
        const method = state.method || 'Telebirr';
        userStates[chatId] = { action: 'awaiting_deposit_sms', amount: amt, method };
        showBankInfo(chatId, method, amt, ioInstance);
        return;
      }

      if (state.action === 'awaiting_deposit_sms') {
        const { amount: amt, method } = state;
        await processDeposit(chatId, telegramId, amt, text, method, ioInstance);
        return;
      }

      if (state.action === 'awaiting_withdraw_amount') {
        const amt = parseFloat(text);
        if (isNaN(amt) || amt <= 0) {
          bot.sendMessage(chatId, `⚠️ Please enter a valid withdrawal amount in numbers (e.g. 100).`);
          return;
        }
        userStates[chatId] = { action: 'awaiting_withdraw_method', amount: amt };
        bot.sendMessage(
          chatId,
          `📤 <b>Withdraw:</b> <code>${amt.toFixed(2)} ETB</code>\n\nChoose withdrawal method:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Telebirr', callback_data: 'cb_with_method_Telebirr' }],
                [{ text: '🏦 CBE Bank', callback_data: 'cb_with_method_CBE' }],
                [{ text: '💳 CBE Birr', callback_data: 'cb_with_method_CBEBirr' }]
              ]
            }
          }
        );
        return;
      }

      if (state.action === 'awaiting_withdraw_account') {
        const { amount: amt, method } = state;
        await processWithdrawal(chatId, telegramId, amt, text, method, ioInstance);
        return;
      }
    });

  } catch (err) {
    console.error('[Telegram Bot] Initialization error:', err.message);
  }
}

// -------------------------------------------------------------
// HELPER & PLAYER FUNCTIONS
// -------------------------------------------------------------

function sendContactRequest(chatId) {
  if (!bot) return;
  bot.sendMessage(
    chatId,
    `🎮 <b>Welcome to Afla Bingo!</b> 🇪🇹\n\nTo access the game, deposit funds, or manage your wallet, you must first register by sharing your verified phone number.\n\n👇 <b>Tap the button below to register:</b>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [
            {
              text: '📱 SHARE PHONE NUMBER TO REGISTER',
              request_contact: true
            }
          ]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );
}

async function checkUserRegistered(chatId, telegramId) {
  const user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
  if (!user || !user.phone || user.phone.startsWith('tg_')) {
    sendContactRequest(chatId);
    return null;
  }
  return user;
}

function sendPlayPrompt(chatId, user) {
  if (!bot) return;
  bot.sendMessage(
    chatId,
    `🎮 <b>Ready to Play Afla Bingo?</b> 🇪🇹\n\nTap the button below to launch the Mini App!`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [getPlayButton()]
        ]
      }
    }
  );
}

function startDepositFlow(chatId) {
  delete userStates[chatId];
  userStates[chatId] = { action: 'awaiting_deposit_method' };

  bot.sendMessage(
    chatId,
    `📥 <b>Deposit Funds</b>\n\nChoose your payment method:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📱 Telebirr', callback_data: 'cb_dep_method_Telebirr' }],
          [{ text: '🏦 CBE Bank', callback_data: 'cb_dep_method_CBE' }],
          [{ text: '💳 CBE Birr', callback_data: 'cb_dep_method_CBEBirr' }]
        ]
      }
    }
  );
}

async function startWithdrawFlow(chatId, telegramId) {
  delete userStates[chatId];
  const user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
  const withdrawableBal = user ? (parseFloat(user.withdrawable_balance) || 0) : 0;

  // Rule: Must have at least 200 ETB in withdrawable (winnings) balance
  if (withdrawableBal < 200) {
    bot.sendMessage(
      chatId,
      `🏆 <b>Withdrawable:</b> <code>${withdrawableBal.toFixed(2)} ETB</code>\n` +
      `⚠️ <b>Minimum:</b> <code>200 ETB</code>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Play to Win', callback_data: 'cb_play' }]
          ]
        }
      }
    );
    return;
  }

  userStates[chatId] = { action: 'awaiting_withdraw_amount' };

  bot.sendMessage(
    chatId,
    `🏆 <b>Withdrawable:</b> <code>${withdrawableBal.toFixed(2)} ETB</code>\n` +
    `✏️ <b>Enter amount</b>:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `All (${Math.floor(withdrawableBal)} ETB)`, callback_data: `cb_with_preset_${Math.floor(withdrawableBal)}` }
          ]
        ]
      }
    }
  );
}

async function getAdminAccount(method) {
  const getSetting = async (key, def) => {
    try {
      const r = await get('SELECT value FROM game_settings WHERE key = ?', [key]);
      return r ? r.value : def;
    } catch(e) { return def; }
  };
  
  if (method === 'Telebirr') {
    return { name: await getSetting('telebirr_name', 'B. E.'), number: await getSetting('telebirr_number', '0993994168'), icon: '📱' };
  } else if (method === 'CBEBirr') {
    return { name: await getSetting('cbebirr_name', 'B. E.'), number: await getSetting('cbebirr_number', '0993994168'), icon: '💲' };
  } else {
    return { name: await getSetting('cbe_name', 'B. E.'), number: await getSetting('cbe_number', '1000483719853'), icon: '🏦' };
  }
}

async function showBankInfo(chatId, method, amount, ioInstance) {
  const acc = await getAdminAccount(method);
  userStates[chatId] = { ...userStates[chatId], action: 'awaiting_deposit_sms' };

  bot.sendMessage(
    chatId,
    `📥 <b>Step 2: Send Payment</b>\n\n💰 <b>Amount:</b> <code>${parseFloat(amount).toFixed(2)} ETB</code>\n\n${acc.icon} <b>Send to this ${escapeHTML(method)} account:</b>\n\n👤 <b>Name:</b> <code>${escapeHTML(acc.name)}</code>\n📞 <b>Number:</b> <code>${escapeHTML(acc.number)}</code>\n\n✅ After sending, reply with your <b>SMS confirmation text or transaction ID</b>.`,
    { parse_mode: 'HTML' }
  );
}

async function notifyAdminNewDeposit(deposit) {
  if (!bot) return;
  try {
    const admins = await all(`SELECT telegram_id FROM users WHERE is_admin = 1`);
    for (const admin of admins) {
      if (admin.telegram_id) {
        bot.sendMessage(
          admin.telegram_id,
          `🚨 <b>NEW DEPOSIT REQUEST</b>\n\n👤 User: <code>${escapeHTML(deposit.username)}</code>\n📱 Phone: <code>${escapeHTML(deposit.phone)}</code>\n💰 Amount: <b>${deposit.amount.toFixed(2)} ETB</b>\n💳 Method: ${escapeHTML(deposit.method)}\n🧾 SMS/TxID: <code>${escapeHTML(deposit.receipt_sms)}</code>\n\n<i>Go to the Admin Panel to approve or reject.</i>`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[Telegram] Admin notification error:', e.message);
  }
}

async function notifyAdminNewWithdrawal(withdrawal) {
  if (!bot) return;
  try {
    const admins = await all(`SELECT telegram_id FROM users WHERE is_admin = 1`);
    for (const admin of admins) {
      if (admin.telegram_id) {
        bot.sendMessage(
          admin.telegram_id,
          `🚨 <b>NEW WITHDRAWAL REQUEST</b>\n\n👤 User: <code>${escapeHTML(withdrawal.username)}</code>\n📱 Phone: <code>${escapeHTML(withdrawal.phone)}</code>\n💰 Amount: <b>${withdrawal.amount.toFixed(2)} ETB</b>\n💳 Method: ${escapeHTML(withdrawal.method)}\n🏦 Account: <code>${escapeHTML(withdrawal.account_number)}</code>\n\n<i>Go to the Admin Panel to approve or reject.</i>`,
          { parse_mode: 'HTML' }
        ).catch(() => {});
      }
    }
  } catch (e) {
    console.error('[Telegram] Admin notification error:', e.message);
  }
}

async function processDeposit(chatId, telegramId, amount, smsText, method, ioInstance) {
  const user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
  if (!user) { sendContactRequest(chatId); return; }

  const chosenMethod = method || userStates[chatId]?.method || 'Telebirr/CBE';

  const result = await run(
    `INSERT INTO deposits (user_id, username, phone, method, amount, proof_image, receipt_sms, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [user.id, user.username, user.phone, chosenMethod, parseFloat(amount), null, smsText]
  );

  const depositId = result.lastID;

  if (ioInstance) ioInstance.emit('admin_data_changed');

  // Notify admin in Telegram
  notifyAdminNewDeposit({
    id: depositId,
    username: user.username,
    phone: user.phone,
    method: chosenMethod,
    amount: parseFloat(amount),
    receipt_sms: smsText
  });

  bot.sendMessage(
    chatId,
    `✅ <b>Deposit Submitted Successfully!</b>\n\n💰 <b>Amount:</b> <code>${parseFloat(amount).toFixed(2)} ETB</code>\n💳 <b>Method:</b> ${escapeHTML(chosenMethod)}\n🧾 <b>Receipt:</b> <code>${escapeHTML(smsText)}</code>\n\n⏳ Admin has been notified. Your wallet will be credited once verified on the admin panel!`,
    { parse_mode: 'HTML' }
  );
  delete userStates[chatId];
}

async function processWithdrawal(chatId, telegramId, amount, accountNum, method, ioInstance) {
  const user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
  if (!user) { sendContactRequest(chatId); return; }

  // Rule 1: Must have deposited at least once (check has_deposited flag or approved deposits)
  const approvedDeposit = await get(`SELECT id FROM deposits WHERE user_id = ? AND status = 'approved'`, [user.id]);
  const hasDeposited = !!(user.has_deposited) || !!approvedDeposit;
  if (!hasDeposited) {
    bot.sendMessage(
      chatId,
      `⛔ <b>Deposit Required:</b> You must make at least one approved deposit before submitting a withdrawal request. Please make a deposit first!`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📥 Deposit Now', callback_data: 'cb_deposit' }]
          ]
        }
      }
    );
    delete userStates[chatId];
    return;
  }
  if (approvedDeposit && !user.has_deposited) {
    await run(`UPDATE users SET has_deposited = 1 WHERE id = ?`, [user.id]).catch(() => {});
  }

  // Rule 2: Minimum withdrawal threshold & withdrawable balance check
  const reqAmount = parseFloat(amount) || 0;
  if (reqAmount < 200) {
    bot.sendMessage(
      chatId,
      `⚠️ Minimum withdrawal is <b>200 ETB</b>.`,
      { parse_mode: 'HTML' }
    );
    delete userStates[chatId];
    return;
  }
  const withdrawableBal = parseFloat(user.withdrawable_balance) || 0;
  if (withdrawableBal < reqAmount) {
    bot.sendMessage(
      chatId,
      `🏆 <b>Withdrawable Winnings:</b> <code>${withdrawableBal.toFixed(2)} ETB</code>\n⚠️ Insufficient withdrawable balance to withdraw ${reqAmount.toFixed(2)} ETB.\n\n<i>Only winnings from Bingo rounds can be withdrawn.</i>`,
      { parse_mode: 'HTML' }
    );
    delete userStates[chatId];
    return;
  }

  const chosenMethod = method || userStates[chatId]?.method || 'Telebirr/CBE';

  const result = await run(
    `INSERT INTO withdrawals (user_id, username, phone, method, account_number, amount, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    [user.id, user.username, user.phone, chosenMethod, accountNum, parseFloat(amount)]
  );

  const withdrawalId = result.lastID;

  if (ioInstance) ioInstance.emit('admin_data_changed');

  // Notify admin in Telegram
  notifyAdminNewWithdrawal({
    id: withdrawalId,
    username: user.username,
    phone: user.phone,
    method: chosenMethod,
    amount: parseFloat(amount),
    account_number: accountNum
  });

  bot.sendMessage(
    chatId,
    `✅ <b>Withdrawal Submitted:</b> <code>${parseFloat(amount).toFixed(2)} ETB</code> via ${escapeHTML(chosenMethod)} (Account: <code>${escapeHTML(accountNum)}</code>). Pending admin review.`,
    { parse_mode: 'HTML' }
  );
  delete userStates[chatId];
}

function getMainReplyKeyboard() {
  const playBtn = isHttps
    ? { text: '🎮 PLAY BINGO', web_app: { url: WEB_APP_URL } }
    : { text: '🎮 PLAY BINGO' };

  return {
    keyboard: [
      [playBtn],
      [
        { text: '💰 Balance' },
        { text: '📥 Deposit' }
      ],
      [
        { text: '📤 Withdraw' },
        { text: '👥 Referral' }
      ]
    ],
    resize_keyboard: true
  };
}

async function sendMainMenu(chatId, user) {
  if (!bot) return;
  const totalBalance = user ? (parseFloat(user.balance) || 0).toFixed(2) : '0.00';
  const withdrawableBal = user ? (parseFloat(user.withdrawable_balance) || 0).toFixed(2) : '0.00';

  bot.sendMessage(
    chatId,
    `🇪🇹 <b>Welcome to Afla Bingo!</b> 🇪🇹\n\n` +
    `👤 <b>Player:</b> <code>${escapeHTML(user?.username || 'Player')}</code>\n` +
    `💰 <b>Total Balance:</b> <code>${totalBalance} ETB</code>\n` +
    `🏆 <b>Withdrawable Winnings:</b> <code>${withdrawableBal} ETB</code>`,
    {
      parse_mode: 'HTML',
      reply_markup: getMainReplyKeyboard()
    }
  );
}

async function sendBalance(chatId, telegramId) {
  if (!bot) return;
  const user = await get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId]);
  const totalBalance = user ? (parseFloat(user.balance) || 0).toFixed(2) : '0.00';
  const withdrawableBal = user ? (parseFloat(user.withdrawable_balance) || 0).toFixed(2) : '0.00';

  bot.sendMessage(
    chatId,
    `💰 <b>Total Balance:</b> <code>${totalBalance} ETB</code>\n` +
    `🏆 <b>Withdrawable:</b> <code>${withdrawableBal} ETB</code>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 Deposit', callback_data: 'cb_deposit' },
            { text: '📤 Withdraw', callback_data: 'cb_withdraw' }
          ]
        ]
      }
    }
  );
}

async function sendReferralInfo(chatId, telegramId) {
  if (!bot) return;
  const activeBotUsername = (bot && bot.botUsername) ? bot.botUsername : 'bingox2019_bot';
  const refLink = `https://t.me/${activeBotUsername}?start=${telegramId}`;

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join Afla Bingo and play to win! 🎰')}`;

  bot.sendMessage(
    chatId,
    `👥 <b>Invite Friends & Earn 5 ETB Bonus!</b>\n\n🔗 <b>Referral Link:</b>\n<code>${escapeHTML(refLink)}</code>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📤 Share', url: shareUrl }]
        ]
      }
    }
  );
}

function sendHelpInfo(chatId, telegramId) {
  if (!bot) return;
  bot.sendMessage(
    chatId,
    `ℹ️ <b>Bingo Rules & Help:</b>\n\n1. <b>Join a Round:</b> Select 1 or more Cartellas (1-400) for 10 ETB each.\n2. <b>Live Draw:</b> Every round draws 75 numbers automatically.\n3. <b>Automatic Daubing:</b> Numbers are marked on your cartella automatically.\n4. <b>Winning:</b> First player to complete a line (horizontal, vertical, diagonal, corners, or full house) wins the POT prize pool!`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📥 Deposit', callback_data: 'cb_deposit' },
            { text: '📤 Withdraw', callback_data: 'cb_withdraw' }
          ]
        ]
      }
    }
  );
}

async function sendTelegramNotification(telegramId, message) {
  if (!bot || !telegramId) return;
  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'HTML' });
  } catch (e) {
    console.error(`[Telegram Bot] Notification error to ${telegramId}:`, e.message);
  }
}

// -------------------------------------------------------------
// MODERN TELEGRAM ADMIN SYSTEM
// -------------------------------------------------------------

async function sendAdminDashboard(chatId, messageId = null, targetBot = bot) {
  const activeBot = targetBot || bot;
  if (!activeBot) return;
  activeBot.sendMessage(
    chatId,
    `🔔 <b>Afla Bingo Admin Notification Center</b> 🇪🇹\n\n` +
    `🟢 <b>Status:</b> Active & Listening\n\n` +
    `You will receive instant push notifications here whenever a player submits a deposit or withdrawal request.\n\n` +
    `Tap below to open the Web Admin Panel:`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [getAdminPanelButton()]
        ]
      }
    }
  ).catch(() => {});
}

async function handleAdminCallback(query, data, chatId, messageId, telegramId, ioInstance, targetBot = bot) {
  const activeBot = targetBot || bot;

  if (data === 'adm_menu') {
    sendAdminDashboard(chatId, messageId, activeBot);
    return;
  }

  // --- SPECIFIC ACTION HANDLERS ---

  // APPROVE DEPOSIT ACTION
  if (data.startsWith('adm_dep_app_')) {
    const depId = data.replace('adm_dep_app_', '');
    const deposit = await get('SELECT * FROM deposits WHERE id = ?', [depId]);

    if (!deposit || deposit.status !== 'pending') {
      try { activeBot.answerCallbackQuery(query.id, { text: '⚠️ Already processed!', show_alert: true }); } catch (e) {}
      sendAdminDashboard(chatId, messageId, activeBot);
      return;
    }

    await run('UPDATE deposits SET status = ? WHERE id = ?', ['approved', depId]);
    await run('UPDATE users SET balance = balance + ? WHERE id = ?', [deposit.amount, deposit.user_id]);
    await run('UPDATE users SET has_deposited = 1 WHERE id = ?', [deposit.user_id]);

    const refRecord = await get(`SELECT * FROM referrals WHERE referee_id = ? AND status = 'pending'`, [deposit.user_id]);
    if (refRecord) {
      await run(`UPDATE referrals SET status = 'qualified' WHERE id = ?`, [refRecord.id]);
      await run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [refRecord.reward_amount, refRecord.referrer_id]);

      const referrer = await get(`SELECT telegram_id FROM users WHERE id = ?`, [refRecord.referrer_id]);
      if (referrer && referrer.telegram_id) {
        sendTelegramNotification(
          referrer.telegram_id,
          `🎁 <b>Referral Reward Claimed!</b> Your referred friend deposited. You earned <b>10 ETB</b>!`
        );
      }
    }

    const updatedUser = await get(`SELECT balance, telegram_id FROM users WHERE id = ?`, [deposit.user_id]);
    if (updatedUser?.telegram_id) {
      sendTelegramNotification(
        updatedUser.telegram_id,
        `✅ <b>Deposit Approved!</b> Your wallet has been credited with <b>${parseFloat(deposit.amount).toFixed(2)} ETB</b>. New Balance: <b>${updatedUser.balance.toFixed(2)} ETB</b>.`
      );
    }

    if (ioInstance) {
      ioInstance.emit('admin_data_changed');
      ioInstance.emit('user_transaction_updated', { userId: deposit.user_id });
      ioInstance.emit('balance_updated', { userId: deposit.user_id, newBalance: updatedUser?.balance });
    }

    try { activeBot.answerCallbackQuery(query.id, { text: `✅ Deposit #${deposit.id} Approved! +${parseFloat(deposit.amount).toFixed(0)} ETB` }); } catch (e) {}
    // Expire the notification message — remove buttons and show result
    activeBot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId }).catch(() => {});
    activeBot.editMessageText(
      `✅ <b>DEPOSIT #${deposit.id} APPROVED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Player:</b> <code>${escapeHTML(deposit.username)}</code>\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(deposit.amount).toFixed(2)} ETB</code>\n` +
      `💳 <b>Method:</b> ${escapeHTML(deposit.method || 'Telebirr/CBE')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🟢 <b>Status: Approved — Wallet Credited</b>`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
    ).catch(() => {});
    return;
  }

  // REJECT DEPOSIT ACTION
  if (data.startsWith('adm_dep_rej_')) {
    const depId = data.replace('adm_dep_rej_', '');
    const deposit = await get('SELECT * FROM deposits WHERE id = ?', [depId]);

    if (!deposit || deposit.status !== 'pending') {
      try { activeBot.answerCallbackQuery(query.id, { text: '⚠️ Already processed!', show_alert: true }); } catch (e) {}
      sendAdminDashboard(chatId, messageId, activeBot);
      return;
    }

    await run('UPDATE deposits SET status = ? WHERE id = ?', ['rejected', depId]);

    const user = await get('SELECT telegram_id FROM users WHERE id = ?', [deposit.user_id]);
    if (user?.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `❌ <b>Deposit Rejected</b>\n\nYour deposit of <b>${deposit.amount} ETB</b> was rejected by admin. Please verify details and try again.`
      );
    }

    if (ioInstance) {
      ioInstance.emit('admin_data_changed');
      ioInstance.emit('user_transaction_updated', { userId: deposit.user_id });
    }

    try { activeBot.answerCallbackQuery(query.id, { text: `❌ Deposit #${depId} Rejected` }); } catch (e) {}
    // Expire the notification message
    activeBot.editMessageText(
      `❌ <b>DEPOSIT #${depId} REJECTED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Player:</b> <code>${escapeHTML(deposit.username)}</code>\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(deposit.amount).toFixed(2)} ETB</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 <b>Status: Rejected</b>`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
    ).catch(() => {});
    return;
  }

  // APPROVE WITHDRAWAL ACTION
  if (data.startsWith('adm_wit_app_')) {
    const wId = data.replace('adm_wit_app_', '');
    const withdrawal = await get('SELECT * FROM withdrawals WHERE id = ?', [wId]);

    if (!withdrawal || withdrawal.status !== 'pending') {
      try { activeBot.answerCallbackQuery(query.id, { text: '⚠️ Already processed!', show_alert: true }); } catch (e) {}
      sendAdminDashboard(chatId, messageId, activeBot);
      return;
    }

    const user = await get('SELECT * FROM users WHERE id = ?', [withdrawal.user_id]);
    const withdrawableBal = parseFloat(user?.withdrawable_balance) || 0;
    if (withdrawableBal < withdrawal.amount) {
      try { activeBot.answerCallbackQuery(query.id, { text: '❌ User has insufficient withdrawable balance!', show_alert: true }); } catch (e) {}
      return;
    }

    await run('UPDATE withdrawals SET status = ? WHERE id = ?', ['approved', wId]);
    await run('UPDATE users SET balance = balance - ? WHERE id = ?', [withdrawal.amount, withdrawal.user_id]);
    await run('UPDATE users SET withdrawable_balance = withdrawable_balance - ? WHERE id = ?', [withdrawal.amount, withdrawal.user_id]);

    const updatedUser = await get('SELECT balance, withdrawable_balance FROM users WHERE id = ?', [withdrawal.user_id]);
    if (user?.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `💸 <b>Withdrawal Approved!</b> Your withdrawal of <b>${parseFloat(withdrawal.amount).toFixed(2)} ETB</b> to ${escapeHTML(withdrawal.account_number)} (${escapeHTML(withdrawal.method)}) has been completed.`
      );
    }

    if (ioInstance) {
      ioInstance.emit('admin_data_changed');
      ioInstance.emit('user_transaction_updated', { userId: withdrawal.user_id });
      ioInstance.emit('balance_updated', { userId: withdrawal.user_id, newBalance: updatedUser?.balance });
    }

    try { activeBot.answerCallbackQuery(query.id, { text: `✅ Withdrawal #${w.id} Approved — ${parseFloat(withdrawal.amount).toFixed(0)} ETB Paid` }); } catch (e) {}
    // Expire the notification message
    activeBot.editMessageText(
      `✅ <b>WITHDRAWAL #${withdrawal.id} APPROVED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Player:</b> <code>${escapeHTML(withdrawal.username)}</code>\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(withdrawal.amount).toFixed(2)} ETB</code>\n` +
      `📞 <b>Account:</b> <code>${escapeHTML(withdrawal.account_number || 'N/A')}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🟢 <b>Status: Approved — Payment Sent</b>`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
    ).catch(() => {});
    return;
  }

  // REJECT WITHDRAWAL ACTION
  if (data.startsWith('adm_wit_rej_')) {
    const wId = data.replace('adm_wit_rej_', '');
    const withdrawal = await get('SELECT * FROM withdrawals WHERE id = ?', [wId]);

    if (!withdrawal || withdrawal.status !== 'pending') {
      try { activeBot.answerCallbackQuery(query.id, { text: '⚠️ Already processed!', show_alert: true }); } catch (e) {}
      sendAdminDashboard(chatId, messageId, activeBot);
      return;
    }

    await run('UPDATE withdrawals SET status = ? WHERE id = ?', ['rejected', wId]);

    const user = await get('SELECT telegram_id FROM users WHERE id = ?', [withdrawal.user_id]);
    if (user?.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `❌ <b>Withdrawal Rejected</b>\n\nYour withdrawal of <b>${withdrawal.amount} ETB</b> was rejected by admin.`
      );
    }

    if (ioInstance) {
      ioInstance.emit('admin_data_changed');
      ioInstance.emit('user_transaction_updated', { userId: withdrawal.user_id });
    }

    try { activeBot.answerCallbackQuery(query.id, { text: `❌ Withdrawal #${wId} Rejected` }); } catch (e) {}
    // Expire the notification message
    activeBot.editMessageText(
      `❌ <b>WITHDRAWAL #${wId} REJECTED</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 <b>Player:</b> <code>${escapeHTML(withdrawal.username)}</code>\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(withdrawal.amount).toFixed(2)} ETB</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 <b>Status: Rejected</b>`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
    ).catch(() => {});
    return;
  }

  // ADD / DEDUCT BALANCE ACTIONS
  if (data.startsWith('adm_usr_add100_') || data.startsWith('adm_usr_ded100_')) {
    const isAdd = data.startsWith('adm_usr_add100_');
    const parts = data.replace(isAdd ? 'adm_usr_add100_' : 'adm_usr_ded100_', '').split('_');
    const userId = parts[0];
    const pageIdx = parseInt(parts[1]) || 0;

    const u = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!u) return;

    const amount = 100.0;
    if (isAdd) {
      await run('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
    } else {
      await run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
    }

    const updated = await get('SELECT balance, telegram_id FROM users WHERE id = ?', [userId]);

    if (updated?.telegram_id) {
      sendTelegramNotification(
        updated.telegram_id,
        `🔔 <b>Wallet Adjusted:</b> Admin ${isAdd ? 'credited' : 'deducted'} <b>100.00 ETB</b>. New Balance: <b>${(updated.balance || 0).toFixed(2)} ETB</b>.`
      );
    }

    if (ioInstance) {
      ioInstance.emit('admin_data_changed');
      ioInstance.emit('balance_updated', { userId, newBalance: updated?.balance });
    }

    try { activeBot.answerCallbackQuery(query.id, { text: `${isAdd ? '➕ Added' : '➖ Deducted'} 100 ETB for ${u.username}`, show_alert: true }); } catch (e) {}
    handleAdminCallback(query, `adm_users_${pageIdx}`, chatId, messageId, telegramId, ioInstance, activeBot);
    return;
  }

  // BAN / UNBAN ACTION
  if (data.startsWith('adm_usr_ban_')) {
    const parts = data.replace('adm_usr_ban_', '').split('_');
    const userId = parts[0];
    const pageIdx = parseInt(parts[1]) || 0;

    const u = await get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!u) return;

    const newStatus = u.is_banned ? 0 : 1;
    await run('UPDATE users SET is_banned = ? WHERE id = ?', [newStatus, userId]);

    try { activeBot.answerCallbackQuery(query.id, { text: `User ${u.username} ${newStatus ? 'BANNED' : 'UNBANNED'}`, show_alert: true }); } catch (e) {}
    handleAdminCallback(query, `adm_users_${pageIdx}`, chatId, messageId, telegramId, ioInstance, activeBot);
    return;
  }

  // --- BROWSER HANDLERS ---

  // 1. PENDING DEPOSITS BROWSER
  if (data.startsWith('adm_dep_')) {
    const idx = parseInt(data.replace('adm_dep_', '')) || 0;
    const deposits = await all('SELECT * FROM deposits WHERE status = \'pending\' ORDER BY id DESC', []);

    if (deposits.length === 0) {
      activeBot.editMessageText(
        `✅ <b>No Pending Deposits!</b>\n\nAll deposit requests have been processed.`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }]]
          }
        }
      ).catch(() => {});
      return;
    }

    const currentIdx = Math.max(0, Math.min(idx, deposits.length - 1));
    const d = deposits[currentIdx];

    const text =
      `📥 <b>PENDING DEPOSIT REVIEW</b> (${currentIdx + 1} of ${deposits.length})\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Deposit ID:</b> <code>#${d.id}</code>\n` +
      `👤 <b>User:</b> <code>${escapeHTML(d.username)}</code> (Phone: <code>${escapeHTML(d.phone || 'N/A')}</code>)\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(d.amount).toFixed(2)} ETB</code>\n` +
      `💳 <b>Method:</b> ${escapeHTML(d.method || 'Telebirr/CBE')}\n` +
      `🧾 <b>SMS/Receipt:</b> <code>${escapeHTML(d.receipt_sms || 'No SMS code')}</code>\n` +
      `📅 <b>Requested:</b> ${d.created_at ? new Date(d.created_at).toLocaleString() : 'N/A'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`;

    const prevIdx = currentIdx > 0 ? currentIdx - 1 : deposits.length - 1;
    const nextIdx = currentIdx < deposits.length - 1 ? currentIdx + 1 : 0;

    const keyboard = [
      [
        { text: '✅ Approve Deposit', callback_data: `adm_dep_app_${d.id}` },
        { text: '❌ Reject Deposit', callback_data: `adm_dep_rej_${d.id}` }
      ],
      [
        { text: '⬅️ Prev', callback_data: `adm_dep_${prevIdx}` },
        { text: `${currentIdx + 1} / ${deposits.length}`, callback_data: `adm_dep_${currentIdx}` },
        { text: '➡️ Next', callback_data: `adm_dep_${nextIdx}` }
      ],
      [
        { text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }
      ]
    ];

    activeBot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
    return;
  }

  // 2. PENDING WITHDRAWALS BROWSER
  if (data.startsWith('adm_wit_')) {
    const idx = parseInt(data.replace('adm_wit_', '')) || 0;
    const withdrawals = await all('SELECT * FROM withdrawals WHERE status = \'pending\' ORDER BY id DESC', []);

    if (withdrawals.length === 0) {
      activeBot.editMessageText(
        `✅ <b>No Pending Withdrawals!</b>\n\nAll withdrawal requests have been processed.`,
        {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{ text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }]]
          }
        }
      ).catch(() => {});
      return;
    }

    const currentIdx = Math.max(0, Math.min(idx, withdrawals.length - 1));
    const w = withdrawals[currentIdx];

    const text =
      `📤 <b>PENDING WITHDRAWAL REVIEW</b> (${currentIdx + 1} of ${withdrawals.length})\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>Withdrawal ID:</b> <code>#${w.id}</code>\n` +
      `👤 <b>User:</b> <code>${escapeHTML(w.username)}</code> (Phone: <code>${escapeHTML(w.phone || 'N/A')}</code>)\n` +
      `💰 <b>Amount:</b> <code>${parseFloat(w.amount).toFixed(2)} ETB</code>\n` +
      `💳 <b>Method:</b> ${escapeHTML(w.method || 'Telebirr/CBE')}\n` +
      `📞 <b>Account Number:</b> <code>${escapeHTML(w.account_number || 'N/A')}</code>\n` +
      `📅 <b>Requested:</b> ${w.created_at ? new Date(w.created_at).toLocaleString() : 'N/A'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`;

    const prevIdx = currentIdx > 0 ? currentIdx - 1 : withdrawals.length - 1;
    const nextIdx = currentIdx < withdrawals.length - 1 ? currentIdx + 1 : 0;

    const keyboard = [
      [
        { text: '✅ Approve & Pay', callback_data: `adm_wit_app_${w.id}` },
        { text: '❌ Reject Withdrawal', callback_data: `adm_wit_rej_${w.id}` }
      ],
      [
        { text: '⬅️ Prev', callback_data: `adm_wit_${prevIdx}` },
        { text: `${currentIdx + 1} / ${withdrawals.length}`, callback_data: `adm_wit_${currentIdx}` },
        { text: '➡️ Next', callback_data: `adm_wit_${nextIdx}` }
      ],
      [
        { text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }
      ]
    ];

    activeBot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
    return;
  }

  // 3. USER MANAGEMENT BROWSER
  if (data.startsWith('adm_users_')) {
    const idx = parseInt(data.replace('adm_users_', '')) || 0;
    const users = await all('SELECT * FROM users WHERE is_admin = 0 OR is_admin IS NULL ORDER BY id DESC', []);

    if (users.length === 0) {
      activeBot.editMessageText(`👥 <b>No Registered Players Found.</b>`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }]] }
      }).catch(() => {});
      return;
    }

    const currentIdx = Math.max(0, Math.min(idx, users.length - 1));
    const u = users[currentIdx];

    const text =
      `👤 <b>PLAYER PROFILE MANAGER</b> (${currentIdx + 1} of ${users.length})\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 <b>User ID:</b> <code>#${u.id}</code>\n` +
      `👤 <b>Username:</b> <code>${escapeHTML(u.username)}</code>\n` +
      `📱 <b>Phone:</b> <code>${escapeHTML(u.phone || 'N/A')}</code>\n` +
      `💰 <b>Wallet Balance:</b> <code>${(u.balance || 0).toFixed(2)} ETB</code>\n` +
      `🎁 <b>Referral Code:</b> <code>${escapeHTML(u.referral_code || 'N/A')}</code>\n` +
      `🚫 <b>Status:</b> ${u.is_banned ? '🔴 BANNED' : '🟢 ACTIVE'}\n` +
      `📅 <b>Joined:</b> ${u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━`;

    const prevIdx = currentIdx > 0 ? currentIdx - 1 : users.length - 1;
    const nextIdx = currentIdx < users.length - 1 ? currentIdx + 1 : 0;

    const keyboard = [
      [
        { text: '➕ Add 100 ETB', callback_data: `adm_usr_add100_${u.id}_${currentIdx}` },
        { text: '➖ Deduct 100 ETB', callback_data: `adm_usr_ded100_${u.id}_${currentIdx}` }
      ],
      [
        { text: u.is_banned ? '🟢 Unban User' : '🔴 Ban User', callback_data: `adm_usr_ban_${u.id}_${currentIdx}` }
      ],
      [
        { text: '⬅️ Prev', callback_data: `adm_users_${prevIdx}` },
        { text: `${currentIdx + 1} / ${users.length}`, callback_data: `adm_users_${currentIdx}` },
        { text: '➡️ Next', callback_data: `adm_users_${nextIdx}` }
      ],
      [
        { text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }
      ]
    ];

    activeBot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
    return;
  }

  // 4. BROADCAST INSTRUCTION
  if (data === 'adm_broadcast') {
    userStates[chatId] = { action: 'awaiting_broadcast' };
    activeBot.sendMessage(
      chatId,
      `📢 <b>Admin Telegram Mass Broadcast</b>\n\nPlease reply to this message with the text message you want to broadcast to ALL registered Telegram players:`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // 5. GAME SETTINGS
  if (data === 'adm_settings') {
    const settingsList = await all('SELECT * FROM game_settings', []);
    const settingsMap = {};
    settingsList.forEach(s => { settingsMap[s.key] = s.value; });

    const text =
      `⚙️ <b>GAME SETTINGS MANAGER</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎟️ <b>Cartella Ticket Price:</b> <code>${escapeHTML(settingsMap.ticket_price || '10')} ETB</code>\n` +
      `⏱️ <b>Round Countdown:</b> <code>${escapeHTML(settingsMap.countdown_sec || '40')} seconds</code>\n` +
      `💼 <b>House Commission:</b> <code>${escapeHTML(settingsMap.commission_pct || '20')}%</code>\n` +
      `⚡ <b>Auto Round Start:</b> <code>${escapeHTML(settingsMap.auto_start || 'true')}</code>\n` +
      `━━━━━━━━━━━━━━━━━━━━━`;

    const keyboard = [
      [
        { text: '🎟️ Set Price 10 ETB', callback_data: 'adm_set_price_10' },
        { text: '🎟️ Set Price 20 ETB', callback_data: 'adm_set_price_20' }
      ],
      [
        { text: '⏱️ Countdown 30s', callback_data: 'adm_set_count_30' },
        { text: '⏱️ Countdown 60s', callback_data: 'adm_set_count_60' }
      ],
      [
        { text: '🔙 Back to Admin Menu', callback_data: 'adm_menu' }
      ]
    ];

    activeBot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard }
    }).catch(() => {});
    return;
  }

  // SETTINGS UPDATES
  if (data.startsWith('adm_set_')) {
    if (data === 'adm_set_price_10') await run(`UPDATE game_settings SET value = '10' WHERE key = 'ticket_price'`);
    if (data === 'adm_set_price_20') await run(`UPDATE game_settings SET value = '20' WHERE key = 'ticket_price'`);
    if (data === 'adm_set_count_30') await run(`UPDATE game_settings SET value = '30' WHERE key = 'countdown_sec'`);
    if (data === 'adm_set_count_60') await run(`UPDATE game_settings SET value = '60' WHERE key = 'countdown_sec'`);

    try { activeBot.answerCallbackQuery(query.id, { text: '⚙️ Setting updated!', show_alert: true }); } catch (e) {}
    handleAdminCallback(query, 'adm_settings', chatId, messageId, telegramId, ioInstance, activeBot);
    return;
  }
}

async function executeAdminBroadcast(adminChatId, broadcastText, targetBot = bot) {
  const activeBot = targetBot || bot;
  if (!activeBot || !broadcastText) return;

  const users = await all('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL', []);
  let sentCount = 0;

  for (const u of users) {
    if (u.telegram_id) {
      try {
        await activeBot.sendMessage(u.telegram_id, `📢 <b>ANNOUNCEMENT:</b> \n\n${escapeHTML(broadcastText)}`, { parse_mode: 'HTML' });
        sentCount++;
      } catch (e) {}
    }
  }

  activeBot.sendMessage(adminChatId, `✅ <b>Broadcast Sent!</b> Successfully delivered to <b>${sentCount}</b> players in Telegram.`, { parse_mode: 'HTML' });
}

module.exports = {
  initTelegramBot,
  sendTelegramNotification,
  notifyAdminNewDeposit,
  notifyAdminNewWithdrawal
};
