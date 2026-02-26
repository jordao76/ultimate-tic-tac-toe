import { describe, it, expect } from 'vitest';
import { UltimateTicTacToe } from 'aye-aye/lib/games/ultimate-tic-tac-toe';
import { X, O, _, bin } from 'aye-aye/lib/games/bin-tic-tac-toe';

// Returns the sorted list of unique board indices from possibleActions
function playableBoards(game) {
  return [...new Set(game.possibleActions().map(([i]) => i))].sort((a, b) => a - b);
}

// A fresh game where all boards are open (no last played position)
function freshGame() {
  const game = new UltimateTicTacToe();
  game.lastPlayedPosition = null;
  return game;
}

describe('board routing', () => {
  it('routes to the board matching the cell that was just played', () => {
    for (let cell = 0; cell < 9; cell++) {
      // Play any board (center = 4), at the given cell
      const next = freshGame().play([4, cell]);
      expect(playableBoards(next)).toEqual([cell]);
    }
  });

  it('cell 4 (center) routes to board 4 (center)', () => {
    const next = freshGame().play([0, 4]);
    expect(playableBoards(next)).toEqual([4]);
  });

  it('falls back to all open boards when the required board is won', () => {
    // Board 0 is won by X (top row)
    const wonByX = bin([X, X, X, _, _, _, _, _, _]);
    const a = [wonByX, _, _, _, _, _, _, _, _];
    // Last played cell = 0 → would require board 0, but it's won
    const game = new UltimateTicTacToe(a, O, 0, 1);
    const boards = playableBoards(game);
    expect(boards).not.toContain(0);         // won board is off-limits
    expect(boards).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // all others open
  });

  it('falls back to all open boards when the required board is full', () => {
    // Board 0 is full with no win (draw position)
    const drawn = bin([X, O, X, X, O, O, O, X, X]);
    const a = [drawn, _, _, _, _, _, _, _, _];
    const game = new UltimateTicTacToe(a, O, 0, 1);
    const boards = playableBoards(game);
    expect(boards).not.toContain(0);
    expect(boards).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('opens all boards on the first move when no prior position is set', () => {
    const game = freshGame();
    const boards = playableBoards(game);
    expect(boards).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('routing is consistent across a multi-move sequence', () => {
    let game = freshGame();
    // Play [board=4, cell=2] → next plays in board 2
    game = game.play([4, 2]);
    expect(playableBoards(game)).toEqual([2]);
    // Play [board=2, cell=7] → next plays in board 7
    game = game.play([2, 7]);
    expect(playableBoards(game)).toEqual([7]);
    // Play [board=7, cell=0] → next plays in board 0
    game = game.play([7, 0]);
    expect(playableBoards(game)).toEqual([0]);
  });
});
