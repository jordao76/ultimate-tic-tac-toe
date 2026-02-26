import { describe, it, expect } from 'vitest';
import { UltimateTicTacToe } from 'aye-aye/lib/games/ultimate-tic-tac-toe';
import { X, O } from 'aye-aye/lib/games/bin-tic-tac-toe';

// Fisher-Yates shuffle — mirrors the implementation in ai-worker.js
function random(i, n) {
  return Math.floor(Math.random() * (n - i) + i);
}
function shuffle(a) {
  const n = a.length;
  if (n === 0) return a;
  for (let i = 0; i < n - 1; i++) {
    const j = random(i, n);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function freshGame() {
  const game = new UltimateTicTacToe();
  game.lastPlayedPosition = null; // open all boards (same as app startup)
  return game;
}

// ── UltimateTicTacToe ────────────────────────────────────────────────────────

describe('UltimateTicTacToe', () => {
  it('starts with X as next player', () => {
    expect(freshGame().nextPlayer).toBe(X);
  });

  it('has 81 possible actions on a fresh game', () => {
    expect(freshGame().possibleActions().length).toBe(81);
  });

  it('play() returns a new instance (immutable)', () => {
    const game = freshGame();
    const next = game.play([4, 0]);
    expect(next).not.toBe(game);
  });

  it('play() switches the active player', () => {
    const game = freshGame();
    expect(game.play([4, 0]).nextPlayer).toBe(O);
    expect(game.play([4, 0]).play([0, 0]).nextPlayer).toBe(X);
  });

  it('play() does not mutate the original state', () => {
    const game = freshGame();
    game.play([4, 0]);
    expect(game.nextPlayer).toBe(X);
    expect(game.at(4, 0)).toBe(0); // position is still empty
  });

  it('constrains the next player to the board matching the last move position', () => {
    const game2 = freshGame().play([4, 3]); // X plays board 4, pos 3 → O must play board 3
    expect(game2.lastPlayedPosition).toBe(3);
    const actions = game2.possibleActions();
    expect(actions.length).toBe(9);
    expect(actions.every(([board]) => board === 3)).toBe(true);
  });

  it('records X on the played tile', () => {
    const game = freshGame();
    const next = game.play([2, 5]);
    expect(next.at(2, 5)).toBe(X);
  });

  it('is not terminal at the start', () => {
    expect(freshGame().isTerminal()).toBe(false);
  });

  it('is not a win at the start', () => {
    expect(freshGame().isWin(X)).toBe(false);
    expect(freshGame().isWin(O)).toBe(false);
  });

  it('possible actions never include already-played positions', () => {
    let game = freshGame();
    game = game.play([4, 0]); // X on board 4 pos 0 — O now constrained to board 0
    game = game.play([0, 0]); // O on board 0 pos 0 — X now constrained to board 0
    const actions = game.possibleActions();
    expect(actions.some(([b, p]) => b === 0 && p === 0)).toBe(false);
  });
});

// ── Fisher-Yates shuffle ─────────────────────────────────────────────────────

describe('shuffle', () => {
  it('returns the same array instance (in-place)', () => {
    const a = [1, 2, 3];
    expect(shuffle(a)).toBe(a);
  });

  it('preserves all elements', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffle([...original]);
    expect(result.sort((a, b) => a - b)).toEqual(original.sort((a, b) => a - b));
  });

  it('handles an empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('produces all permutations over many runs (statistical)', () => {
    // For [0,1,2] there are 6 permutations; each should appear roughly 1/6 of the time
    const counts = {};
    const runs = 3000;
    for (let i = 0; i < runs; i++) {
      const key = shuffle([0, 1, 2]).join('');
      counts[key] = (counts[key] ?? 0) + 1;
    }
    expect(Object.keys(counts).length).toBe(6); // all 6 permutations observed
    for (const count of Object.values(counts)) {
      // Each permutation should appear roughly runs/6 = 500 times; allow ±50%
      expect(count).toBeGreaterThan(runs / 6 * 0.5);
      expect(count).toBeLessThan(runs / 6 * 1.5);
    }
  });
});
