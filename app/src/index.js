const $ = jQuery;

const { X, O, decode } = require('aye-aye/lib/games/bin-tic-tac-toe');
const { UltimateTicTacToe } = require('aye-aye/lib/games/ultimate-tic-tac-toe');

const { showSpinner, hideSpinner } = require('./spinner');
require('./highlight');

const { RTC } = require('./web-rtc');

$(() => {
  let game = null;
  let lastAction = null;

  function playable() {
    const className = game.nextPlayer === X ? 'x-playable-tile' : 'o-playable-tile';
    for (const [i, j] of game.possibleActions()) {
      $(`#${i}\\,${j}`).addClass(className);
    }
    return className;
  }

  function unplayable() {
    $('.tile')
      .removeClass('x-playable-tile')
      .removeClass('o-playable-tile')
      .removeClass('human-playable-tile')
      .off('click');
  }

  function markWins() {
    for (let i = 0; i < 9; i++) {
      let wonBy = null;
      for (const j of game.winOn(i)) {
        wonBy = game.at(i, j);
        const wonClass = wonBy === X ? 'x-won-tile' : 'o-won-tile';
        $(`#${i}\\,${j}`).addClass(wonClass);
      }
      if (wonBy != null) {
        const wonClass = wonBy === X ? 'x-won-board' : 'o-won-board';
        $(`#${i}`).addClass(wonClass);
      }
    }
  }

  function checkGameOver() {
    if (!game.isTerminal()) return false;
    const endText =
      game.isWin(X) ? 'X Wins!' :
      game.isWin(O) ? 'O Wins!' :
      'Draw!';
    $('#end-text').text(endText);
    $('#modal-game-over').modal('show');
    return true;
  }

  function playerText() {
    return decode(game.nextPlayer).toLowerCase();
  }

  function playAction(action) {
    const [i, j] = action;
    hideSpinner();
    $(`#${i}\\,${j}`).text(playerText()).highlight();
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

  function createPlayerX() {
    return players[$('#btn-player-x').text()]();
  }
  function createPlayerO() {
    return players[$('#btn-player-o').text()]();
  }

  function swapPlayers() {
    const $x = $('#btn-player-x');
    const $o = $('#btn-player-o');
    const tmp = $x.text();
    $x.text($o.text());
    $o.text(tmp);
  }

  $('.player').on('click', function () {
    const $player = $(this);
    const playerFor = $player.data('player-for');
    const $btn = $(`#btn-player-${playerFor}`);
    const playerName = $player.text();
    const currentPlayerName = $btn.text();
    if (currentPlayerName !== playerName) {
      $btn.text(playerName);
      setup();
    }
  });

  function humanPlayer() {
    function parseAction(text) {
      const match = text.match(/(\d),(\d)/);
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
    return {
      setup(done) { done(); },
      play() {
        if (checkGameOver()) return;
        const playableClassName = playable();
        $(`.${playableClassName}`)
          .addClass('human-playable-tile')
          .on('click', function () {
            const action = parseAction($(this).get(0).id);
            playAction(action);
          });
      },
    };
  }

  function computerPlayer(agentName = 'minimax', depth = 3) {
    const worker = new Worker('src/ai-worker.min.js');
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

  $.fn.enable = function (v = true) { return $(this).prop('disabled', !v); };

  RTC.greet();
  RTC.ondatachannelopen = () => {
    const [xPlayer, oPlayer] = RTC.isHost ? ['human', 'peer'] : ['peer', 'human'];
    $('#btn-player-x').text(xPlayer).enable(false);
    $('#btn-player-o').text(oPlayer).enable(false);
    setup();
  };
  RTC.ondisconnected = () => {
    $('#btn-player-x').text('human').enable();
    $('#btn-player-o').text('smart AI').enable();
    setup();
  };

  function remotePlayer() {
    const sendNew = () => RTC.send('new');
    $('#btn-new-game').on('click', sendNew);
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
      teardown() { $('#btn-new-game').off('click', sendNew); },
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
    $('.tic-tac-toe').removeClass('x-won-board').removeClass('o-won-board');
    $('.tile').removeClass('x-won-tile').removeClass('o-won-tile').text('');
  }

  function newGame() {
    swapPlayers();
    setup();
  }

  $('#btn-new-game').on('click', newGame);

  setup();
});
