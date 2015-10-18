$ = jQuery

{X, O, decode} = require 'aye-aye/lib/games/bin-tic-tac-toe'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

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
    for [i,j] in game.possibleActions()
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
      for j in game.winOn i
        wonClass = if (game.at i, j) is X then 'x-won-tile' else 'o-won-tile'
        $ "##{i}\\,#{j}"
          .addClass wonClass

  checkGameOver = ->
    return no unless game.isTerminal()
    playerX.end?()
    playerO.end?()
    $ '#game-over-text'
      .text switch
        when game.isWin(X) then 'X Wins!'
        when game.isWin(O) then 'O Wins!'
        else 'Draw!'
    $ '#game-over'
      .off 'hidden.bs.modal'
      .on 'hidden.bs.modal', setup
      .modal 'show'
    yes

  computerPlayer = (depth = 3) ->
    worker = new Worker 'scripts/minimax-worker.min.js'
    worker.postMessage command: 'setup', depth: depth
    worker.onmessage = (e) ->
      [i, j] = e.data.action
      $ "##{i}\\,#{j}"
        .text (decode game.nextPlayer).toLowerCase()
        .highlight()
      game = game.play [i, j]
      next()
    play: ->
      unplayable()
      markWins()
      return if checkGameOver()
      playable()
      worker.postMessage command: 'play', gameState: game.state()
    end: ->
      worker.terminate()

  humanPlayer = ->
    int = (s) -> parseInt s, 10
    parseId = (text) ->
      match = text.match /(\d),(\d)/
      [(int match[1]), (int match[2])]
    play: ->
      unplayable()
      markWins()
      return if checkGameOver()
      playableClassName = playable()
      $ ".#{playableClassName}"
        .addClass 'human-playable-tile'
        .on 'click', ->
          tile = ($ this)
          tile.text (decode game.nextPlayer).toLowerCase()
          game = game.play parseId tile.get(0).id
          next()

  setup = ->
    game = new UltimateTicTacToe
    playerX = createPlayerX()
    playerO = createPlayerO()
    $ '.tile'
      .removeClass 'x-won-tile'
      .removeClass 'o-won-tile'
      .text ''
    next()

  setup()

$.fn.highlight = ->
  ($ this).each ->
    el = $ this
    $ '<div/>'
      .width el.outerWidth()
      .height el.outerHeight()
      .css
        'position': 'absolute'
        'left': el.offset().left
        'top': el.offset().top
        'background-color': '#ffff77'
        'opacity': .7
        'z-index': 10
      .appendTo 'body'
      .fadeOut 1000
      .queue -> ($ this).remove()
