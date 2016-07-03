# coffeelint: disable=max_line_length

{MinimaxAgent} = require 'aye-aye'
{MonteCarloAgent} = require 'aye-aye/lib/monte-carlo'
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
      agentName = e.data.args.agentName ? 'minimax'
      depth = e.data.args.depth ? 3
      player = computerPlayer agentName, depth
    when 'play'
      lastAction = e.data.args.lastAction
      game = game.play lastAction if lastAction?
      action = player.play game
      game = game.play action
      self.postMessage {action}

computerPlayer = (agentName = 'minimax', depth = 3) ->
  agent = if agentName is 'minimax' then new MinimaxAgent depth else new MonteCarloAgent timeFrameMs: depth
  play: (game) ->
    return if game.isTerminal()
    agent.nextAction game
