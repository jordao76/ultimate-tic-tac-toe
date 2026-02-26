import { X, O, decode } from 'aye-aye/lib/games/bin-tic-tac-toe';
import { UltimateTicTacToe } from 'aye-aye/lib/games/ultimate-tic-tac-toe';
import { showSpinner, hideSpinner } from './spinner';
import { highlight } from './highlight';
import { RTC } from './web-rtc';
import { buildBoard } from './board';

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

function makeBoardOverlaySvg(player) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 10');
  svg.setAttribute('aria-hidden', 'true');
  if (player === X) {
    for (const [x1, y1, x2, y2] of [[1.5, 1.5, 8.5, 8.5], [8.5, 1.5, 1.5, 8.5]]) {
      const line = document.createElementNS(SVG_NS, 'line');
      Object.entries({ x1, y1, x2, y2, stroke: 'var(--color-x)', 'stroke-width': '2', 'stroke-linecap': 'round' })
        .forEach(([k, v]) => line.setAttribute(k, v));
      svg.appendChild(line);
    }
  } else {
    const circle = document.createElementNS(SVG_NS, 'circle');
    Object.entries({ cx: '5', cy: '5', r: '4', stroke: 'var(--color-o)', 'stroke-width': '2', fill: 'none' })
      .forEach(([k, v]) => circle.setAttribute(k, v));
    svg.appendChild(circle);
  }
  return svg;
}

document.addEventListener('DOMContentLoaded', () => {
  buildBoard(document.getElementById('ultimate-tic-tac-toe'));

  // ── Theme toggle ────────────────────────────────────────────
  const html = document.documentElement;
  const themeBtn = document.getElementById('btn-theme-toggle');
  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(dark) {
    html.dataset.theme = dark ? 'dark' : 'light';
    themeBtn.textContent = dark ? 'Light mode' : 'Dark mode';
  }
  applyTheme(mql.matches);
  mql.addEventListener('change', (e) => {
    if (!html.dataset.theme) applyTheme(e.matches);
  });
  themeBtn.addEventListener('click', () => {
    applyTheme(html.dataset.theme !== 'dark');
  });

  let game = null;
  let lastAction = null;
  let humanClickController = null;

  const selX = document.getElementById('select-player-x');
  const selO = document.getElementById('select-player-o');
  const dialog = document.getElementById('modal-game-over');

  // Close dialog on backdrop click
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  document.getElementById('btn-play-again').addEventListener('click', () => {
    dialog.close();
    newGame();
  });

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
        const boardEl = document.getElementById(String(i));
        const wonClass = wonBy === X ? 'x-won-board' : 'o-won-board';
        boardEl.classList.add(wonClass);
        if (!boardEl.querySelector('.board-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'board-overlay';
          overlay.appendChild(makeBoardOverlaySvg(wonBy));
          boardEl.appendChild(overlay);
        }
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
    dialog.className = game.isWin(X) ? 'x-win' : game.isWin(O) ? 'o-win' : '';
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
    tile.classList.add('tile-played');
    tile.addEventListener('animationend', () => tile.classList.remove('tile-played'), { once: true });
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
    for (const overlay of document.querySelectorAll('.board-overlay')) {
      overlay.remove();
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
