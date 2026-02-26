// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { buildBoard } from '../app/src/board.js';

describe('board layout', () => {
  let root;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    buildBoard(root);
  });

  it('board rows appear in order 0–2 top to bottom', () => {
    const rows = root.querySelectorAll('.board-row');
    expect(rows).toHaveLength(3);
    // First row must contain boards 0,1,2; last row boards 6,7,8
    const firstRowBoards = [...rows[0].querySelectorAll('.tic-tac-toe')].map((el) => Number(el.id));
    const lastRowBoards = [...rows[2].querySelectorAll('.tic-tac-toe')].map((el) => Number(el.id));
    expect(firstRowBoards).toEqual([0, 1, 2]);
    expect(lastRowBoards).toEqual([6, 7, 8]);
  });

  it('cell positions within a sub-board correspond to board positions in the overall grid', () => {
    // The visual position of cell j within any sub-board must match the visual
    // position of board j — both use row-major order (0=top-left, 4=center, 8=bottom-right).
    const boardRows = root.querySelectorAll('.board-row');
    for (let brow = 0; brow < 3; brow++) {
      const subBoards = boardRows[brow].querySelectorAll('.tic-tac-toe');
      for (let bcol = 0; bcol < 3; bcol++) {
        const boardId = Number(subBoards[bcol].id);
        expect(boardId).toBe(brow * 3 + bcol);
        // Cell 0 (top-left within the sub-board) should appear first in DOM order
        const tiles = subBoards[bcol].querySelectorAll('.tile');
        const firstTileCell = Number(tiles[0].id.split(',')[1]);
        expect(firstTileCell).toBe(0);
      }
    }
  });

  it('tile ids encode the correct [board, cell] pair', () => {
    for (let board = 0; board < 9; board++) {
      for (let cell = 0; cell < 9; cell++) {
        const tile = document.getElementById(`${board},${cell}`);
        expect(tile).not.toBeNull();
        const [b, c] = tile.id.split(',').map(Number);
        expect(b).toBe(board);
        expect(c).toBe(cell);
      }
    }
  });
});
