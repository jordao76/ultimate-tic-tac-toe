{MinimaxAgent} = require 'aye-aye'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

player = null
game = null

# returns random j such that i ≤ j < n
random = (i, n) -> Math.floor(Math.random()*(n-i)+i)

# Fisher–Yates
shuffle = (a) ->
  n = a.length
  return a if n is 0
  for i in [0...n-1]
    j = random i, n
    [a[i],a[j]] = [a[j],a[i]]
  a

UltimateTicTacToe::possibleActions = ->
  return @actions if @actions?
  res = []
  for [i, js] in @openPositions()
    for j in js
      res.push [i, j]
  @actions = shuffle res

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
