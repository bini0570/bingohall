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
        bot.editMessageText(
          `📥 <b>${escapeHTML(method)} Deposit</b>\n\nPlease enter the amount you want to deposit in ETB (e.g. 100):`,
          { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
        ).catch(() => {});
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
        bot.editMessageText(
          `📤 <b>Withdraw:</b> <code>${amt.toFixed(2)} ETB</code> — Select method:`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📱 Telebirr', callback_data: 'cb_with_method_Telebirr' }],
                [{ text: '💳 CBE Birr', callback_data: 'cb_with_method_CBEBirr' }]
              ]
            }
          }
        ).catch(() => {});
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
        bot.editMessageText(
          `📤 <b>Withdraw ${amt.toFixed(2)} ETB via ${escapeHTML(method)}</b>\nEnter your account or phone number:`,
          { chat_id: chatId, message_id: messageId, parse_mode: 'HTML' }
        ).catch(() => {});
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

module.exports = {
  initTelegramBot,
  sendTelegramNotification
};
