import { MinimaxAgent } from 'aye-aye';
import { MonteCarloAgent } from 'aye-aye/lib/monte-carlo';
import { UltimateTicTacToe } from 'aye-aye/lib/games/ultimate-tic-tac-toe';

let player = null;
let game = null;

// returns random j such that i <= j < n
function random(i, n) {
  return Math.floor(Math.random() * (n - i) + i);
}

// Fisher-Yates shuffle
function shuffle(a) {
  const n = a.length;
  if (n === 0) return a;
  for (let i = 0; i < n - 1; i++) {
    const j = random(i, n);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

UltimateTicTacToe.prototype.possibleActions = function () {
  if (this.actions) return this.actions;
  const res = [];
  for (const [i, js] of this.openPositions()) {
    for (const j of js) {
      res.push([i, j]);
    }
  }
  this.actions = shuffle(res);
  return this.actions;
};

self.onmessage = (e) => {
  switch (e.data.command) {
    case 'setup': {
      game = new UltimateTicTacToe();
      const agentName = e.data.args.agentName ?? 'minimax';
      const depth = e.data.args.depth ?? 3;
      player = computerPlayer(agentName, depth);
      break;
    }
    case 'play': {
      const lastAction = e.data.args.lastAction;
      if (lastAction) game = game.play(lastAction);
      const action = player.play(game);
      game = game.play(action);
      self.postMessage({ action });
      break;
    }
  }
};

function computerPlayer(agentName = 'minimax', depth = 3) {
  const agent =
    agentName === 'minimax'
      ? new MinimaxAgent(depth)
      : new MonteCarloAgent({ timeFrameMs: depth });
  return {
    play(game) {
      if (game.isTerminal()) return;
      return agent.nextAction(game);
    },
  };
}
