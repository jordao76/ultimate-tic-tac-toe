$ = jQuery

{X, O, decode} = require 'aye-aye/lib/games/bin-tic-tac-toe'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

{showSpinner, hideSpinner} = require './spinner'
require './highlight'

UltimateTicTacToe::state = ->
  {@a, @nextPlayer, @lastPlayedPosition, @depth}

$ ->

  game = null
  playerX = null
  playerO = null
  createPlayerX = -> humanPlayer()
  createPlayerO = -> computerPlayer()

  # player :: {
  #   setup : (done: ->) ->
  #   teardown : ->
  #   play : ->
  #   toString : -> Str
  # }

  next = ->
    unplayable()
    markWins()
    player = if game.nextPlayer is X then playerX else playerO
    player.play()

  playable = ->
    className =
      if game.nextPlayer is X then 'x-playable-tile' else 'o-playable-tile'
    for [i, j] in game.possibleActions()
      $ "##{i}\\,#{j}"
        .addClass className
    className

  unplayable = ->
    $ '.tile'
      .removeClass 'x-playable-tile'
      .removeClass 'o-playable-tile'
      .removeClass 'human-playable-tile'
      .off 'click'

  markWins = ->
    for i in [0...9]
      wonBy = null
      for j in game.winOn i
        wonBy = game.at i, j
        wonClass = if wonBy is X then 'x-won-tile' else 'o-won-tile'
        ($ "##{i}\\,#{j}").addClass wonClass
      if wonBy?
        wonClass = if wonBy is X then 'x-won-board' else 'o-won-board'
        ($ '#' + i).addClass wonClass

  checkGameOver = ->
    return no unless game.isTerminal()
    $ '#info'
      .text switch
        when game.isWin(X) then 'X Wins!'
        when game.isWin(O) then 'O Wins!'
        else 'Draw!'
    yes

  playerText = -> (decode game.nextPlayer).toLowerCase()

  # bus :: {
  #   setup : (done : ->)
  #   teardown : ->
  #   postMessage : (message : Any) ->
  #   onMessage : (callback : (m: Any) ->) ->
  #   toString : -> Str
  # }
  messagingPlayer = (bus) ->
    onAction = ([i, j]) ->
      hideSpinner()
      $ "##{i}\\,#{j}"
        .text playerText()
        .highlight()
      game = game.play [i, j]
      next()
    setup: (done) ->
      bus.setup ->
        bus.onmessage (m) -> onAction m.action
        done()
    play: ->
      return if checkGameOver()
      playable()
      showSpinner()
      bus.postMessage command: 'play', args: game.state()
    teardown: -> bus.teardown()
    toString: -> bus.toString()

  computerPlayer = (depth = 3) ->
    worker = new Worker 'scripts/minimax-worker.min.js'
    bus =
      setup: (done) ->
        worker.postMessage command: 'setup', args: depth
        done()
      postMessage: (m) -> worker.postMessage m
      onmessage: (f) -> worker.onmessage = (e) -> f e.data
      teardown: -> worker.terminate()
      toString: -> 'computer'
    messagingPlayer bus

  humanPlayer = ->
    int = (s) -> parseInt s, 10
    parseId = (text) ->
      match = text.match /(\d),(\d)/
      [(int match[1]), (int match[2])]
    setup: (done) -> done()
    play: ->
      return if checkGameOver()
      playableClassName = playable()
      $ ".#{playableClassName}"
        .addClass 'human-playable-tile'
        .on 'click', ->
          $tile = $ this
          $tile.text playerText()
          game = game.play parseId $tile.get(0).id
          next()
    toString: -> "human"

  setup = ->
    teardown()
    game = new UltimateTicTacToe
    [playerX, playerO] = [createPlayerX(), createPlayerO()]
    # swap for next time
    [createPlayerX, createPlayerO] = [createPlayerO, createPlayerX]
    $ '#info'
      .text playerX + " vs " + playerO
    playerX.setup -> playerO.setup -> next()

  teardown = ->
    playerX?.teardown?()
    playerO?.teardown?()
    hideSpinner()
    $ '.tic-tac-toe'
      .removeClass 'x-won-board'
      .removeClass 'o-won-board'
    $ '.tile'
      .removeClass 'x-won-tile'
      .removeClass 'o-won-tile'
      .text ''

  $ '#btn-new-game'
    .on 'click', setup

  setup()
