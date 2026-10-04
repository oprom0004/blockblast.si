/**
 * BLOCKBLAST.SI - High-Performance Heuristic AI Solver Engine
 * Simulates exhaustive 3-piece permutations on an 8x8 grid to maximize score, combo, and survival.
 */

const SHAPES_DB = {
  // 1. Single & Dots
  'dot_1': { id: 'dot_1', name: '1x1 Dot', matrix: [[1]] },

  // 2. Lines (Horizontal & Vertical)
  'line_h2': { id: 'line_h2', name: '2x1 Line', matrix: [[1, 1]] },
  'line_v2': { id: 'line_v2', name: '1x2 Line', matrix: [[1], [1]] },
  'line_h3': { id: 'line_h3', name: '3x1 Line', matrix: [[1, 1, 1]] },
  'line_v3': { id: 'line_v3', name: '1x3 Line', matrix: [[1], [1], [1]] },
  'line_h4': { id: 'line_h4', name: '4x1 Line', matrix: [[1, 1, 1, 1]] },
  'line_v4': { id: 'line_v4', name: '1x4 Line', matrix: [[1], [1], [1], [1]] },
  'line_h5': { id: 'line_h5', name: '5x1 Line', matrix: [[1, 1, 1, 1, 1]] },
  'line_v5': { id: 'line_v5', name: '1x5 Line', matrix: [[1], [1], [1], [1], [1]] },

  // 3. Squares
  'square_2': { id: 'square_2', name: '2x2 Box', matrix: [[1, 1], [1, 1]] },
  'square_3': { id: 'square_3', name: '3x3 Giant Box', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },

  // 4. Corners (Small 2x2 Ls)
  'corner_tl': { id: 'corner_tl', name: 'Small Corner TL', matrix: [[1, 1], [1, 0]] },
  'corner_tr': { id: 'corner_tr', name: 'Small Corner TR', matrix: [[1, 1], [0, 1]] },
  'corner_bl': { id: 'corner_bl', name: 'Small Corner BL', matrix: [[1, 0], [1, 1]] },
  'corner_br': { id: 'corner_br', name: 'Small Corner BR', matrix: [[0, 1], [1, 1]] },

  // 5. Large L-Shapes (3x3)
  'L_large_bl': { id: 'L_large_bl', name: 'Large L (BL)', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  'L_large_br': { id: 'L_large_br', name: 'Large L (BR)', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  'L_large_tl': { id: 'L_large_tl', name: 'Large L (TL)', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  'L_large_tr': { id: 'L_large_tr', name: 'Large L (TR)', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },

  // 6. Medium L-Shapes (3x2 and 2x3)
  'L_med_1': { id: 'L_med_1', name: '3x2 L', matrix: [[1, 0], [1, 0], [1, 1]] },
  'L_med_2': { id: 'L_med_2', name: '3x2 J', matrix: [[0, 1], [0, 1], [1, 1]] },
  'L_med_3': { id: 'L_med_3', name: '2x3 L', matrix: [[1, 1, 1], [1, 0, 0]] },
  'L_med_4': { id: 'L_med_4', name: '2x3 J', matrix: [[1, 1, 1], [0, 0, 1]] },

  // 7. T-Shapes & Z-Shapes
  'T_up': { id: 'T_up', name: 'T-Shape Up', matrix: [[1, 1, 1], [0, 1, 0]] },
  'T_down': { id: 'T_down', name: 'T-Shape Down', matrix: [[0, 1, 0], [1, 1, 1]] },
  'Z_h': { id: 'Z_h', name: 'Z-Shape', matrix: [[1, 1, 0], [0, 1, 1]] },
  'S_h': { id: 'S_h', name: 'S-Shape', matrix: [[0, 1, 1], [1, 1, 0]] }
};

class BlockBlastSolver {
  constructor() {
    this.GRID_SIZE = 8;
  }

  createEmptyBoard() {
    return Array.from({ length: 8 }, () => Array(8).fill(0));
  }

  cloneBoard(board) {
    return board.map(row => [...row]);
  }

  canPlace(board, matrix, startR, startC) {
    const numRows = matrix.length;
    const numCols = matrix[0].length;

    if (startR + numRows > 8 || startC + numCols > 8 || startR < 0 || startC < 0) {
      return false;
    }

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (matrix[r][c] === 1 && board[startR + r][startC + c] === 1) {
          return false;
        }
      }
    }
    return true;
  }

  placeAndClear(board, matrix, startR, startC) {
    const nextBoard = this.cloneBoard(board);
    const numRows = matrix.length;
    const numCols = matrix[0].length;
    let placedBlocksCount = 0;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (matrix[r][c] === 1) {
          nextBoard[startR + r][startC + c] = 1;
          placedBlocksCount++;
        }
      }
    }

    // Identify full rows and columns
    const fullRows = [];
    const fullCols = [];

    for (let r = 0; r < 8; r++) {
      if (nextBoard[r].every(cell => cell === 1)) {
        fullRows.push(r);
      }
    }

    for (let c = 0; c < 8; c++) {
      let isFull = true;
      for (let r = 0; r < 8; r++) {
        if (nextBoard[r][c] === 0) {
          isFull = false;
          break;
        }
      }
      if (isFull) fullCols.push(c);
    }

    // Clear identified full lines
    for (let r of fullRows) {
      for (let c = 0; c < 8; c++) nextBoard[r][c] = 0;
    }
    for (let c of fullCols) {
      for (let r = 0; r < 8; r++) nextBoard[r][c] = 0;
    }

    const linesCleared = fullRows.length + fullCols.length;
    const points = placedBlocksCount * 10 + linesCleared * 100 + (linesCleared > 1 ? linesCleared * 150 : 0);

    return {
      board: nextBoard,
      linesCleared,
      clearedRows: fullRows,
      clearedCols: fullCols,
      points
    };
  }

  evaluateBoard(board) {
    let emptyCells = 0;
    let isolatedHoles = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === 0) {
          emptyCells++;
          // Check if surrounded by walls or filled cells
          let neighborsOccupied = 0;
          if (r === 0 || board[r - 1][c] === 1) neighborsOccupied++;
          if (r === 7 || board[r + 1][c] === 1) neighborsOccupied++;
          if (c === 0 || board[r][c - 1] === 1) neighborsOccupied++;
          if (c === 7 || board[r][c + 1] === 1) neighborsOccupied++;
          if (neighborsOccupied >= 3) isolatedHoles++;
        }
      }
    }

    // Survival Check: Can the board fit a 3x3 Giant Box or 5x1 Line?
    let canFit3x3 = false;
    for (let r = 0; r <= 5; r++) {
      for (let c = 0; c <= 5; c++) {
        let fits = true;
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            if (board[r + dr][c + dc] === 1) { fits = false; break; }
          }
          if (!fits) break;
        }
        if (fits) { canFit3x3 = true; break; }
      }
      if (canFit3x3) break;
    }

    let score = emptyCells * 15;
    if (canFit3x3) score += 400; // Crucial safety buffer
    score -= isolatedHoles * 50;  // Severe penalty for unusable 1x1 traps

    return score;
  }

  solve(currentBoard, pieceIds) {
    const pieces = pieceIds.map(id => SHAPES_DB[id] ? SHAPES_DB[id].matrix : null).filter(Boolean);
    if (pieces.length === 0) return null;

    let bestSolution = null;
    let maxOverallScore = -Infinity;

    // Generate permutations of remaining piece indices (e.g. [0,1,2])
    const indices = pieces.map((_, i) => i);
    const permutations = this.getPermutations(indices);

    for (let perm of permutations) {
      this.searchPermutation(currentBoard, pieces, perm, 0, [], 0, (solutionPath, totalScore) => {
        if (totalScore > maxOverallScore) {
          maxOverallScore = totalScore;
          bestSolution = solutionPath;
        }
      });
    }

    return bestSolution;
  }

  searchPermutation(board, pieces, perm, stepIndex, currentSteps, accumulatedPoints, onComplete) {
    if (stepIndex === perm.length) {
      const boardFitness = this.evaluateBoard(board);
      const totalScore = accumulatedPoints * 2 + boardFitness;
      onComplete(currentSteps, totalScore);
      return;
    }

    const pieceIdx = perm[stepIndex];
    const matrix = pieces[pieceIdx];
    let foundValidPlacement = false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.canPlace(board, matrix, r, c)) {
          foundValidPlacement = true;
          const result = this.placeAndClear(board, matrix, r, c);
          
          const stepRecord = {
            step: stepIndex + 1,
            pieceIndex: pieceIdx,
            row: r,
            col: c,
            matrix: matrix,
            linesCleared: result.linesCleared,
            clearedRows: result.clearedRows,
            clearedCols: result.clearedCols,
            points: result.points,
            resultingBoard: result.board
          };

          this.searchPermutation(
            result.board,
            pieces,
            perm,
            stepIndex + 1,
            [...currentSteps, stepRecord],
            accumulatedPoints + result.points,
            onComplete
          );
        }
      }
    }

    // If no moves can be made in this branch, evaluate partial survival
    if (!foundValidPlacement && currentSteps.length > 0) {
      const penalty = (perm.length - stepIndex) * 500;
      onComplete(currentSteps, accumulatedPoints - penalty);
    }
  }

  getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
      const remainingPerms = this.getPermutations(remaining);
      for (let p of remainingPerms) {
        result.push([current, ...p]);
      }
    }
    return result;
  }
}

// Global solver instance
window.blockBlastSolver = new BlockBlastSolver();
window.SHAPES_DB = SHAPES_DB;
