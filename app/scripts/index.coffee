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

  next = ->
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

  computerPlayer = (depth = 3) ->
    worker = null
    setup: (done) ->
      worker = new Worker 'scripts/minimax-worker.min.js'
      worker.postMessage command: 'setup', depth: depth
      worker.onmessage = (e) ->
        hideSpinner()
        [i, j] = e.data.action
        $ "##{i}\\,#{j}"
          .text playerText()
          .highlight()
        game = game.play [i, j]
        next()
      done()
    play: ->
      unplayable()
      markWins()
      return if checkGameOver()
      playable()
      showSpinner()
      worker.postMessage command: 'play', gameState: game.state()
    end: -> worker.terminate()
    toString: -> "computer"

  humanPlayer = ->
    int = (s) -> parseInt s, 10
    parseId = (text) ->
      match = text.match /(\d),(\d)/
      [(int match[1]), (int match[2])]
    setup: (done) -> done()
    play: ->
      unplayable()
      markWins()
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
    playerX?.end?()
    playerO?.end?()
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
