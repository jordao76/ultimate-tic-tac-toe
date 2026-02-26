export function buildBoard(root) {
  const fragment = document.createDocumentFragment();
  for (let urow = 0; urow < 3; urow++) {
    const boardRow = document.createElement('div');
    boardRow.className = 'board-row';
    for (let ucol = 0; ucol < 3; ucol++) {
      const board = urow * 3 + ucol;
      const ttt = document.createElement('div');
      ttt.className = 'tic-tac-toe';
      ttt.id = board;
      for (let row = 0; row < 3; row++) {
        const tttRow = document.createElement('div');
        tttRow.className = 'ttt-row';
        for (let col = 0; col < 3; col++) {
          const tile = document.createElement('div');
          tile.className = 'tile';
          tile.id = `${board},${row * 3 + col}`;
          tttRow.appendChild(tile);
        }
        ttt.appendChild(tttRow);
      }
      boardRow.appendChild(ttt);
    }
    fragment.appendChild(boardRow);
  }
  root.insertBefore(fragment, root.firstChild);
}
