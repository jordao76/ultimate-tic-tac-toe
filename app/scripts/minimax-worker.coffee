{MinimaxAgent} = require 'aye-aye'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

player = null
game = null

self.onmessage = (e) ->
  switch e.data.command
    when 'setup'
      game = new UltimateTicTacToe
      depth = e.data.args.depth
      player = computerPlayer depth
    when 'play'
      lastAction = e.data.args.lastAction
      game = game.play lastAction if lastAction?
      action = player.play game
      game = game.play action
      self.postMessage {action}

computerPlayer = (depth = 3) ->
  agent = new MinimaxAgent depth
  play: (game) ->
    return if game.isTerminal()
    agent.nextAction game
