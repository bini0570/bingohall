/**
 * Helper to validate bingo winning patterns on 5x5 grids
 */
function validateBingoPattern(grid, calledNumbersSet) {
  const set = new Set(calledNumbersSet);
  set.add(0); // FREE space in center

  const winningPatterns = [];

  // 1. Horizontal Rows
  for (let r = 0; r < 5; r++) {
    if (grid[r].every(num => set.has(num))) {
      winningPatterns.push(`Horizontal Row ${r + 1}`);
    }
  }

  // 2. Vertical Columns
  for (let c = 0; c < 5; c++) {
    const colNums = [grid[0][c], grid[1][c], grid[2][c], grid[3][c], grid[4][c]];
    if (colNums.every(num => set.has(num))) {
      winningPatterns.push(`Vertical Column ${c + 1}`);
    }
  }

  // 3. Main Diagonal (top-left to bottom-right)
  const diag1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
  if (diag1.every(num => set.has(num))) {
    winningPatterns.push('Main Diagonal');
  }

  // 4. Reverse Diagonal (top-right to bottom-left)
  const diag2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];
  if (diag2.every(num => set.has(num))) {
    winningPatterns.push('Reverse Diagonal');
  }

  // 5. Four Corners
  const corners = [grid[0][0], grid[0][4], grid[4][0], grid[4][4]];
  if (corners.every(num => set.has(num))) {
    winningPatterns.push('Four Corners');
  }

  // 6. Full House (all 25 spaces matched)
  const allNums = grid.flat();
  if (allNums.every(num => set.has(num))) {
    winningPatterns.push('Full House');
  }

  return {
    isWinner: winningPatterns.length > 0,
    patterns: winningPatterns
  };
}

module.exports = { validateBingoPattern };
