const { run, get, all } = require('./db');

class BingoEngine {
  constructor(io) {
    this.io = io;
    this.status = 'WAITING';
    this.currentRoundId = null;
    this.ticketPrice = 10.0;
    this.commissionPct = 20.0;
    this.countdownSec = 40;
    this.secondsLeft = 40;
    this.drawSpeedSec = 3;
    this.countdownTimer = null;
    this.drawInterval = null;
    this._endingRound = false; // GUARD: prevent double endRound call

    this.calledNumbers = [];
    this.allBalls = Array.from({ length: 75 }, (_, i) => i + 1);
    this.remainingBalls = [...this.allBalls];

    this.cartellas = [];
    this.purchasedTickets = [];
    this.winners = [];
  }

  async init() {
    await this.loadSettings();
    await this.recoverOrStartRound();
  }

  async recoverOrStartRound() {
    try {
      const activeRound = await get(
        `SELECT * FROM game_rounds WHERE status IN ('COUNTDOWN', 'DRAWING', 'WAITING') ORDER BY id DESC LIMIT 1`
      );

      if (activeRound) {
        console.log(`[BingoEngine] Found active round #${activeRound.id} (${activeRound.status}). Recovering state from Supabase...`);
        this.currentRoundId = activeRound.id;
        this.status = activeRound.status;
        if (activeRound.ticket_price) this.ticketPrice = parseFloat(activeRound.ticket_price);

        this.generate400Cartellas();

        const savedTickets = await all(`SELECT * FROM tickets WHERE round_id = ?`, [this.currentRoundId]);
        this.purchasedTickets = (savedTickets || []).map(t => {
          let grid = [];
          try { grid = typeof t.numbers_json === 'string' ? JSON.parse(t.numbers_json) : t.numbers_json; } catch (e) {}

          if (this.cartellas[t.cartella_index - 1]) {
            this.cartellas[t.cartella_index - 1].isSold = true;
            this.cartellas[t.cartella_index - 1].purchasedBy = t.username;
          }

          return {
            userId: t.user_id,
            username: t.username,
            cartellaIndex: t.cartella_index,
            grid
          };
        });

        if (activeRound.called_numbers_json) {
          try {
            this.calledNumbers = JSON.parse(activeRound.called_numbers_json);
            const calledSet = new Set(this.calledNumbers);
            this.remainingBalls = this.allBalls.filter(b => !calledSet.has(b)).sort(() => Math.random() - 0.5);
          } catch (e) {
            this.calledNumbers = [];
            this.remainingBalls = [...this.allBalls].sort(() => Math.random() - 0.5);
          }
        } else {
          this.calledNumbers = [];
          this.remainingBalls = [...this.allBalls].sort(() => Math.random() - 0.5);
        }

        console.log(`[BingoEngine] ✅ Recovered round #${this.currentRoundId}: ${this.purchasedTickets.length} tickets, ${this.calledNumbers.length} called balls.`);

        if (this.status === 'DRAWING') {
          this.startBallDraw();
        } else {
          this.startCountdown();
        }
        return;
      }
    } catch (e) {
      console.error('[BingoEngine] State recovery error:', e.message);
    }

    await this.startNewRound();
  }

  async loadSettings() {
    try {
      const priceRow = await get(`SELECT value FROM game_settings WHERE key = 'ticket_price'`);
      if (priceRow) this.ticketPrice = parseFloat(priceRow.value);

      const commRow = await get(`SELECT value FROM game_settings WHERE key = 'commission_pct'`);
      if (commRow) this.commissionPct = parseFloat(commRow.value);

      const countRow = await get(`SELECT value FROM game_settings WHERE key = 'countdown_sec'`);
      if (countRow) this.countdownSec = parseInt(countRow.value) || 40;

      const speedRow = await get(`SELECT value FROM game_settings WHERE key = 'draw_speed_sec'`);
      if (speedRow) this.drawSpeedSec = parseInt(speedRow.value);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  generate400Cartellas() {
    this.cartellas = [];
    for (let index = 1; index <= 400; index++) {
      const card = this.generateSingleCartella(index);
      this.cartellas.push(card);
    }
  }

  generateSingleCartella(id) {
    const getRandomNumbers = (min, max, count) => {
      const nums = new Set();
      while (nums.size < count) {
        nums.add(Math.floor(Math.random() * (max - min + 1)) + min);
      }
      return Array.from(nums).sort((a, b) => a - b);
    };

    const b = getRandomNumbers(1, 15, 5);
    const i = getRandomNumbers(16, 30, 5);
    const n = getRandomNumbers(31, 45, 5); // 5 numbers; center cell overridden to FREE (0)
    const g = getRandomNumbers(46, 60, 5);
    const o = getRandomNumbers(61, 75, 5);

    const grid = [];
    for (let r = 0; r < 5; r++) {
      const row = [
        b[r],
        i[r],
        r === 2 ? 0 : n[r], // row 2 col 2 = FREE space (0)
        g[r],
        o[r]
      ];
      grid.push(row);
    }

    return {
      id,
      grid,
      purchasedBy: null,
      isSold: false
    };
  }

  async startNewRound() {
    // Clear all timers
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
    if (this.drawInterval) { clearInterval(this.drawInterval); this.drawInterval = null; }

    this._endingRound = false;
    this.status = 'COUNTDOWN';
    this.secondsLeft = this.countdownSec;
    this.calledNumbers = [];
    this.remainingBalls = [...this.allBalls].sort(() => Math.random() - 0.5);
    this.purchasedTickets = [];
    this.winners = [];
    this.generate400Cartellas();

    const result = await run(
      `INSERT INTO game_rounds (status, ticket_price, total_tickets, prize_pool, commission_cut) VALUES (?, ?, ?, ?, ?)`,
      ['COUNTDOWN', this.ticketPrice, 0, 0.0, 0.0]
    );
    this.currentRoundId = result.lastID;

    this.startCountdown();
  }

  async purchaseTicket(userId, username, cartellaIndex) {
    if (this.status !== 'WAITING' && this.status !== 'COUNTDOWN') {
      throw new Error('Ticket sales are closed for this round');
    }

    if (cartellaIndex < 1 || cartellaIndex > 400) {
      throw new Error('Invalid cartella number');
    }

    const cartella = this.cartellas[cartellaIndex - 1];
    if (cartella.isSold) {
      throw new Error('This cartella is already taken by another player');
    }

    const myTickets = this.purchasedTickets.filter(t => String(t.userId) === String(userId));
    if (myTickets.length >= 4) {
      throw new Error('Maximum 4 cartellas allowed per player in a single round');
    }

    const user = await get(`SELECT balance FROM users WHERE id = ?`, [userId]);
    if (!user || user.balance < this.ticketPrice) {
      throw new Error('Insufficient wallet balance (10 ETB required)');
    }

    const newBalance = user.balance - this.ticketPrice;
    await run(`UPDATE users SET balance = ? WHERE id = ?`, [newBalance, userId]);

    cartella.isSold = true;
    cartella.purchasedBy = username;

    const ticketObj = {
      userId,
      username,
      cartellaIndex,
      grid: cartella.grid
    };
    this.purchasedTickets.push(ticketObj);

    await run(
      `INSERT INTO tickets (round_id, user_id, username, cartella_index, numbers_json) VALUES (?, ?, ?, ?, ?)`,
      [this.currentRoundId, userId, username, cartellaIndex, JSON.stringify(cartella.grid)]
    );

    const totalTickets = this.purchasedTickets.length;
    const grossTotal = totalTickets * this.ticketPrice;
    const commCut = grossTotal * (this.commissionPct / 100);
    const netPrize = grossTotal - commCut;

    await run(
      `UPDATE game_rounds SET total_tickets = ?, prize_pool = ?, commission_cut = ? WHERE id = ?`,
      [totalTickets, netPrize, commCut, this.currentRoundId]
    );

    // Also emit balance update so frontend wallet pill is immediately in sync
    this.io.emit('balance_updated', { userId: String(userId), newBalance });

    this.broadcastState();
    return { success: true, newBalance, cartellaIndex };
  }

  async unselectTicket(userId, cartellaIndex) {
    if (this.status !== 'WAITING' && this.status !== 'COUNTDOWN') {
      throw new Error('Ticket unselection is closed for this round');
    }

    const indexInList = this.purchasedTickets.findIndex(
      t => String(t.userId) === String(userId) && t.cartellaIndex === cartellaIndex
    );

    if (indexInList === -1) {
      throw new Error('Cartella not found in your purchases');
    }

    this.purchasedTickets.splice(indexInList, 1);

    const cartella = this.cartellas[cartellaIndex - 1];
    if (cartella) {
      cartella.isSold = false;
      cartella.purchasedBy = null;
    }

    const user = await get(`SELECT balance FROM users WHERE id = ?`, [userId]);
    const newBalance = (user?.balance || 0) + this.ticketPrice;
    await run(`UPDATE users SET balance = ? WHERE id = ?`, [newBalance, userId]);

    const totalTickets = this.purchasedTickets.length;
    const grossTotal = totalTickets * this.ticketPrice;
    const commCut = grossTotal * (this.commissionPct / 100);
    const netPrize = grossTotal - commCut;

    await run(
      `UPDATE game_rounds SET total_tickets = ?, prize_pool = ?, commission_cut = ? WHERE id = ?`,
      [totalTickets, netPrize, commCut, this.currentRoundId]
    );

    // Emit balance update
    this.io.emit('balance_updated', { userId: String(userId), newBalance });

    this.broadcastState();
    return { success: true, newBalance, cartellaIndex };
  }

  startCountdown() {
    this.status = 'COUNTDOWN';
    this.secondsLeft = this.countdownSec;
    this._endingRound = false;

    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }

    this.broadcastState();
    this.io.emit('countdown_tick', { secondsLeft: this.secondsLeft });

    this.countdownTimer = setInterval(async () => {
      if (this.secondsLeft > 0) {
        this.secondsLeft--;
      }
      this.io.emit('countdown_tick', { secondsLeft: Math.max(0, this.secondsLeft) });

      if (this.secondsLeft <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;

        if (this.purchasedTickets.length >= 2) {
          console.log('[BingoEngine] Enough players. Starting draw!');
          await this.startBallDraw();
        } else {
          console.log('[BingoEngine] Not enough players. Restarting countdown...');
          this.secondsLeft = this.countdownSec;
          this.broadcastState();
          this.io.emit('countdown_reset', { secondsLeft: this.countdownSec });
          this.startCountdown();
        }
      }
    }, 1000);
  }

  async forceStartDraw() {
    if (this.status === 'DRAWING' || this.status === 'ENDED') {
      throw new Error('Game is already drawing or ended');
    }
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
    await this.startBallDraw();
    return { success: true, message: 'Game draw force-started by admin' };
  }

  restartCountdownAdmin() {
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
    if (this.drawInterval) { clearInterval(this.drawInterval); this.drawInterval = null; }
    this.startCountdown();
    return { success: true, message: 'Countdown restarted' };
  }

  async startBallDraw() {
    this.status = 'DRAWING';
    this._endingRound = false;
    await run(`UPDATE game_rounds SET status = 'DRAWING' WHERE id = ?`, [this.currentRoundId]);
    this.broadcastState();

    if (this.drawInterval) { clearInterval(this.drawInterval); this.drawInterval = null; }

    this.drawInterval = setInterval(async () => {
      // Safety guard: if already ending, stop here
      if (this._endingRound) {
        clearInterval(this.drawInterval);
        this.drawInterval = null;
        return;
      }

      if (this.remainingBalls.length === 0) {
        clearInterval(this.drawInterval);
        this.drawInterval = null;
        if (!this._endingRound) {
          this._endingRound = true;
          await this.endRound();
        }
        return;
      }

      const nextBall = this.remainingBalls.pop();
      this.calledNumbers.push(nextBall);

      // Persist called numbers to Supabase for crash recovery
      run(`UPDATE game_rounds SET called_numbers_json = ? WHERE id = ?`, [
        JSON.stringify(this.calledNumbers),
        this.currentRoundId
      ]).catch(e => console.error('[BingoEngine] Failed to persist called numbers:', e.message));
      const letter = this.getBallLetter(nextBall);

      this.io.emit('ball_drawn', {
        number: nextBall,
        letter,
        calledNumbers: this.calledNumbers,
        remainingCount: this.remainingBalls.length
      });

      const foundWinners = this.checkWinners();
      if (foundWinners.length > 0) {
        this.winners = foundWinners;
        clearInterval(this.drawInterval);
        this.drawInterval = null;
        if (!this._endingRound) {
          this._endingRound = true;
          await this.endRound();
        }
      }
    }, this.drawSpeedSec * 1000);
  }

  getBallLetter(number) {
    if (number <= 15) return 'B';
    if (number <= 30) return 'I';
    if (number <= 45) return 'N';
    if (number <= 60) return 'G';
    return 'O';
  }

  checkWinners() {
    const calledSet = new Set(this.calledNumbers);
    calledSet.add(0); // FREE space is always called

    const currentWinners = [];
    for (const ticket of this.purchasedTickets) {
      const grid = ticket.grid;
      let hasWinningPattern = false;
      let winningPatternName = '';
      let winningLine = null; // {type, index} for frontend highlight

      // Check horizontal rows
      for (let r = 0; r < 5; r++) {
        if (grid[r].every(num => calledSet.has(num))) {
          hasWinningPattern = true;
          winningPatternName = `Row ${r + 1}`;
          winningLine = { type: 'row', index: r };
          break;
        }
      }

      // Check vertical columns
      if (!hasWinningPattern) {
        for (let c = 0; c < 5; c++) {
          const colNums = [grid[0][c], grid[1][c], grid[2][c], grid[3][c], grid[4][c]];
          if (colNums.every(num => calledSet.has(num))) {
            hasWinningPattern = true;
            winningPatternName = `Column ${c + 1}`;
            winningLine = { type: 'col', index: c };
            break;
          }
        }
      }

      // Check diagonals
      if (!hasWinningPattern) {
        const diag1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
        const diag2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];
        if (diag1.every(num => calledSet.has(num))) {
          hasWinningPattern = true;
          winningPatternName = 'Main Diagonal';
          winningLine = { type: 'diag', index: 0 };
        } else if (diag2.every(num => calledSet.has(num))) {
          hasWinningPattern = true;
          winningPatternName = 'Reverse Diagonal';
          winningLine = { type: 'diag', index: 1 };
        }
      }

      // Check four corners
      if (!hasWinningPattern) {
        const corners = [grid[0][0], grid[0][4], grid[4][0], grid[4][4]];
        if (corners.every(num => calledSet.has(num))) {
          hasWinningPattern = true;
          winningPatternName = 'Four Corners';
          winningLine = { type: 'corners' };
        }
      }

      if (hasWinningPattern) {
        currentWinners.push({
          userId: ticket.userId,
          username: ticket.username,
          cartellaIndex: ticket.cartellaIndex,
          pattern: winningPatternName,
          winningLine,
          grid: ticket.grid
        });
      }
    }
    return currentWinners;
  }

  async endRound() {
    this.status = 'ENDED';

    const totalTickets = this.purchasedTickets.length;
    const grossTotal = totalTickets * this.ticketPrice;
    const commCut = grossTotal * (this.commissionPct / 100);
    const netPrizePool = grossTotal - commCut;

    let splitPrizePerWinner = 0;
    if (this.winners.length > 0) {
      splitPrizePerWinner = netPrizePool / this.winners.length;
      for (const w of this.winners) {
        w.prize = splitPrizePerWinner;
        // Winnings go to withdrawable_balance (withdrawable section)
        await run(`UPDATE users SET withdrawable_balance = withdrawable_balance + ? WHERE id = ?`, [splitPrizePerWinner, w.userId]);
        // Also add to total balance so user can see total and buy tickets
        await run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [splitPrizePerWinner, w.userId]);
        // Fetch fresh balance and emit to winner's client immediately
        const freshUser = await get(`SELECT balance FROM users WHERE id = ?`, [w.userId]);
        if (freshUser) {
          this.io.emit('balance_updated', { userId: String(w.userId), newBalance: freshUser.balance });
        }
      }
    }

    const winnerIdsStr = JSON.stringify(this.winners);
    const calledStr = JSON.stringify(this.calledNumbers);

    await run(
      `UPDATE game_rounds SET status = 'ENDED', winner_ids = ?, called_numbers = ? WHERE id = ?`,
      [winnerIdsStr, calledStr, this.currentRoundId]
    );

    this.io.emit('round_ended', {
      winners: this.winners,
      prizePool: netPrizePool,
      splitPrizePerWinner,
      calledNumbers: this.calledNumbers
    });

    // Start next round after 8 seconds (gives clients time to show winner modal)
    setTimeout(async () => {
      await this.startNewRound();
    }, 8000);
  }

  getPublicState() {
    const totalTickets = this.purchasedTickets.length;
    const grossTotal = totalTickets * this.ticketPrice;
    const commCut = grossTotal * (this.commissionPct / 100);
    const prizePool = grossTotal - commCut;

    return {
      roundId: this.currentRoundId,
      status: this.status,
      ticketPrice: this.ticketPrice,
      totalTickets,
      prizePool,
      secondsLeft: this.secondsLeft,
      calledNumbers: this.calledNumbers,
      lastCalledBall: this.calledNumbers[this.calledNumbers.length - 1] || null,
      winners: this.winners,
      cartellasCount: 400,
      purchasedTickets: this.purchasedTickets,
      soldCartellaIndices: this.purchasedTickets.map(t => t.cartellaIndex)
    };
  }

  broadcastState() {
    this.io.emit('round_state', this.getPublicState());
  }
}

module.exports = BingoEngine;
