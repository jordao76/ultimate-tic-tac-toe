import { X, O, decode } from 'aye-aye/lib/games/bin-tic-tac-toe';
import { UltimateTicTacToe } from 'aye-aye/lib/games/ultimate-tic-tac-toe';
import { showSpinner, hideSpinner } from './spinner';
import { highlight } from './highlight';
import { RTC } from './web-rtc';

const SVG_NS = 'http://www.w3.org/2000/svg';

function makeSvgX() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('aria-hidden', 'true');
  for (const [x1, y1, x2, y2] of [[2, 2, 8, 8], [8, 2, 2, 8]]) {
    const line = document.createElementNS(SVG_NS, 'line');
    Object.entries({ x1, y1, x2, y2, stroke: 'var(--color-x)', 'stroke-width': '1.8', 'stroke-linecap': 'round' })
      .forEach(([k, v]) => line.setAttribute(k, v));
    svg.appendChild(line);
  }
  return svg;
}

function makeSvgO() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(SVG_NS, 'circle');
  Object.entries({ cx: '5', cy: '5', r: '3.2', stroke: 'var(--color-o)', 'stroke-width': '1.8', fill: 'none' })
    .forEach(([k, v]) => circle.setAttribute(k, v));
  svg.appendChild(circle);
  return svg;
}

function buildBoard() {
  const root = document.getElementById('ultimate-tic-tac-toe');
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
    root.insertBefore(boardRow, root.firstChild);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  buildBoard();

  let game = null;
  let lastAction = null;
  let humanClickController = null;

  const selX = document.getElementById('select-player-x');
  const selO = document.getElementById('select-player-o');
  const dialog = document.getElementById('modal-game-over');

  // Close dialog on click (allows dismissing the game-over screen)
  dialog.addEventListener('click', () => dialog.close());

  function playable() {
    const className = game.nextPlayer === X ? 'x-playable-tile' : 'o-playable-tile';
    for (const [i, j] of game.possibleActions()) {
      document.getElementById(`${i},${j}`).classList.add(className);
    }
    return className;
  }

  function unplayable() {
    humanClickController?.abort();
    humanClickController = null;
    for (const tile of document.querySelectorAll('.tile')) {
      tile.classList.remove('x-playable-tile', 'o-playable-tile', 'human-playable-tile');
    }
  }

  function markWins() {
    for (let i = 0; i < 9; i++) {
      let wonBy = null;
      for (const j of game.winOn(i)) {
        wonBy = game.at(i, j);
        const wonClass = wonBy === X ? 'x-won-tile' : 'o-won-tile';
        document.getElementById(`${i},${j}`).classList.add(wonClass);
      }
      if (wonBy != null) {
        const wonClass = wonBy === X ? 'x-won-board' : 'o-won-board';
        document.getElementById(String(i)).classList.add(wonClass);
      }
    }
  }

  function checkGameOver() {
    if (!game.isTerminal()) return false;
    const endText =
      game.isWin(X) ? 'X Wins!' :
      game.isWin(O) ? 'O Wins!' :
      'Draw!';
    document.getElementById('end-text').textContent = endText;
    dialog.showModal();
    return true;
  }

  function playerText() {
    return decode(game.nextPlayer).toLowerCase();
  }

  function playAction(action) {
    const [i, j] = action;
    hideSpinner();
    const tile = document.getElementById(`${i},${j}`);
    tile.innerHTML = '';
    tile.appendChild(game.nextPlayer === X ? makeSvgX() : makeSvgO());
    highlight(tile);
    game = game.play(action);
    lastAction = action;
    next();
  }

  // player :: {
  //   setup : (done: () => void) => void
  //   teardown : () => void
  //   play : () => void
  // }

  let playerX = null;
  let playerO = null;

  function next() {
    unplayable();
    markWins();
    const player = game.nextPlayer === X ? playerX : playerO;
    player.play();
  }

  const players = {
    human: () => humanPlayer(),
    peer: () => remotePlayer(),
    'starter AI': () => computerPlayer('monte-carlo', 500),
    'smart AI': () => computerPlayer('minimax', 3),
  };

  function createPlayerX() { return players[selX.value](); }
  function createPlayerO() { return players[selO.value](); }

  function swapPlayers() {
    const tmp = selX.value;
    selX.value = selO.value;
    selO.value = tmp;
  }

  selX.addEventListener('change', setup);
  selO.addEventListener('change', setup);

  function humanPlayer() {
    function parseAction(id) {
      const [i, j] = id.split(',').map(Number);
      return [i, j];
    }
    return {
      setup(done) { done(); },
      play() {
        if (checkGameOver()) return;
        const playableClassName = playable();
        humanClickController = new AbortController();
        const { signal } = humanClickController;
        for (const tile of document.querySelectorAll(`.${playableClassName}`)) {
          tile.classList.add('human-playable-tile');
          tile.addEventListener('click', () => playAction(parseAction(tile.id)), { signal });
        }
      },
    };
  }

  function computerPlayer(agentName = 'minimax', depth = 3) {
    const worker = new Worker(new URL('./ai-worker.js', import.meta.url), { type: 'module' });
    return {
      setup(done) {
        worker.onmessage = (e) => playAction(e.data.action);
        worker.postMessage({ command: 'setup', args: { agentName, depth } });
        done();
      },
      play() {
        if (checkGameOver()) return;
        playable();
        showSpinner();
        worker.postMessage({ command: 'play', args: { lastAction } });
      },
      teardown() { worker.terminate(); },
    };
  }

  RTC.greet();
  RTC.ondatachannelopen = () => {
    const [xPlayer, oPlayer] = RTC.isHost ? ['human', 'peer'] : ['peer', 'human'];
    selX.value = xPlayer;
    selX.disabled = true;
    selO.value = oPlayer;
    selO.disabled = true;
    setup();
  };
  RTC.ondisconnected = () => {
    selX.value = 'human';
    selX.disabled = false;
    selO.value = 'smart AI';
    selO.disabled = false;
    setup();
  };

  function remotePlayer() {
    const sendNew = () => RTC.send('new');
    const btnNewGame = document.getElementById('btn-new-game');
    btnNewGame.addEventListener('click', sendNew);
    RTC.onmessage = (data) => {
      if (data === 'new') newGame(); else playAction(data);
    };
    return {
      setup(done) { done(); },
      play() {
        if (!checkGameOver()) {
          playable();
          showSpinner();
        }
        if (lastAction != null) RTC.send(lastAction);
      },
      teardown() { btnNewGame.removeEventListener('click', sendNew); },
    };
  }

  function setup() {
    teardown();
    game = new UltimateTicTacToe();
    game.lastPlayedPosition = null; // start with the full board open
    lastAction = null;
    [playerX, playerO] = [createPlayerX(), createPlayerO()];
    playerX.setup(() => playerO.setup(() => next()));
  }

  function teardown() {
    playerX?.teardown?.();
    playerO?.teardown?.();
    hideSpinner();
    for (const el of document.querySelectorAll('.tic-tac-toe')) {
      el.classList.remove('x-won-board', 'o-won-board');
    }
    for (const tile of document.querySelectorAll('.tile')) {
      tile.classList.remove('x-won-tile', 'o-won-tile');
      tile.innerHTML = '';
    }
  }

  function newGame() {
    swapPlayers();
    setup();
  }

  document.getElementById('btn-new-game').addEventListener('click', newGame);

  setup();
});
