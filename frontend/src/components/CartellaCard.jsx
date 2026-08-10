import React from 'react';

export default function CartellaCard({ id, grid = [], calledSet, price = 10, compact = false }) {
  // Always include FREE space (0) in calledSet for win detection
  const effectiveSet = new Set(calledSet || []);
  effectiveSet.add(0);

  const winningCells = new Set();
  let isBingo = false;
  let patternName = '';

  if (grid && grid.length === 5) {
    const isSet = num => effectiveSet.has(num);

    // Rows
    for (let r = 0; r < 5; r++) {
      if (grid[r].every(num => isSet(num))) {
        isBingo = true;
        patternName = `Row ${r + 1}`;
        for (let c = 0; c < 5; c++) winningCells.add(`${r}-${c}`);
      }
    }

    // Columns
    for (let c = 0; c < 5; c++) {
      const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c], grid[4][c]];
      if (col.every(num => isSet(num))) {
        isBingo = true;
        patternName = `Col ${c + 1}`;
        for (let r = 0; r < 5; r++) winningCells.add(`${r}-${c}`);
      }
    }

    // Main diagonal
    if (!isBingo) {
      const d1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
      if (d1.every(num => isSet(num))) {
        isBingo = true;
        patternName = 'Diagonal ↘';
        for (let i = 0; i < 5; i++) winningCells.add(`${i}-${i}`);
      }
    }

    // Reverse diagonal
    if (!isBingo) {
      const d2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];
      if (d2.every(num => isSet(num))) {
        isBingo = true;
        patternName = 'Diagonal ↙';
        for (let i = 0; i < 5; i++) winningCells.add(`${i}-${4 - i}`);
      }
    }

    // Corners
    if (!isBingo) {
      const corners = [grid[0][0], grid[0][4], grid[4][0], grid[4][4]];
      if (corners.every(num => isSet(num))) {
        isBingo = true;
        patternName = 'Corners';
        winningCells.add('0-0'); winningCells.add('0-4');
        winningCells.add('4-0'); winningCells.add('4-4');
      }
    }
  }

  const cardClass = `cartella-card${compact ? ' cartella-card--compact' : ''}`;

  return (
    <div
      className={cardClass}
      style={{
        position: 'relative',
        ...(isBingo ? { border: '1.5px solid #f59e0b', boxShadow: '0 0 24px rgba(245,158,11,0.5)' } : {})
      }}
    >
      {/* BINGO badge */}
      {isBingo && (
        <div
          style={{
            position: 'absolute',
            top: '-14px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            padding: '4px 14px',
            borderRadius: '20px',
            fontWeight: '900',
            fontSize: '11px',
            boxShadow: '0 0 18px rgba(245,158,11,0.9)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            letterSpacing: '0.3px'
          }}
        >
          🏆 BINGO! {patternName}
        </div>
      )}

      {/* Card header row */}
      {!compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px 6px',
            fontSize: '11px',
            fontWeight: '800'
          }}
        >
          <span style={{ color: '#94a3b8' }}>#{id}</span>
          <span style={{ color: '#f59e0b' }}>{price} ETB</span>
        </div>
      )}

      {/* BINGO column labels */}
      <div className="cartella-header">
        <div>B</div>
        <div>I</div>
        <div>N</div>
        <div>G</div>
        <div>O</div>
      </div>

      {/* Grid cells */}
      <div className="cartella-grid">
        {grid.map((row, rIdx) =>
          row.map((num, cIdx) => {
            const isFree = num === 0;
            const isDaubed = effectiveSet.has(num);
            const isWin = winningCells.has(`${rIdx}-${cIdx}`);

            let cls = 'cartella-cell';
            if (isFree) cls += ' free daubed';
            else if (isWin) cls += ' winning';
            else if (isDaubed) cls += ' daubed';

            return (
              <div key={`${rIdx}-${cIdx}`} className={cls}>
                {isFree ? '★ FREE' : num}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
