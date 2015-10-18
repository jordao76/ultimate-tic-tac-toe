{MinimaxAgent} = require 'aye-aye'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

UltimateTicTacToe.fromState = ({a, nextPlayer, lastPlayedPosition, depth}) ->
  new UltimateTicTacToe a, nextPlayer, lastPlayedPosition, depth

player = null

self.onmessage = (e) ->
  switch e.data.command
    when 'setup'
      depth = e.data.depth
      player = computerPlayer depth
    when 'play'
      gameState = e.data.gameState
      game = UltimateTicTacToe.fromState gameState
      action = player.play game
      self.postMessage {action}

computerPlayer = (depth = 3) ->
  agent = new MinimaxAgent depth
  play: (game) ->
    return if game.isTerminal()
    agent.nextAction game
