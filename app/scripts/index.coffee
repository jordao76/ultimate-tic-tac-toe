$ = jQuery

{MinimaxAgent} = require 'aye-aye'
{X, O, decode} = require 'aye-aye/lib/games/bin-tic-tac-toe'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

$ ->

  game = null
  playerX = null
  playerO = null

  next = ->
    player = if game.nextPlayer is X then playerX else playerO
    player.play()

  unplayable = ->
    $ '.tile'
      .removeClass 'playable-tile'
      .off 'click'

  markWins = ->
    for i in [0...9]
      for j in game.winOn i
        wonClass = if (game.at i, j) is X then 'x-won-tile' else 'o-won-tile'
        $ "##{i}\\,#{j}"
          .addClass wonClass

  checkGameOver = ->
    return no unless game.isTerminal()
    $ '#game-over-text'
      .text switch
        when game.isWin(X) then 'X Wins!'
        when game.isWin(O) then 'O Wins!'
        else 'Draw!'
    $ '#game-over'
      .on 'hidden.bs.modal', -> setup()
      .modal 'show'
    yes

  computerPlayer = (depth = 3) ->
    agent = new MinimaxAgent depth
    play: ->
      window.setTimeout ->
        unplayable()
        markWins()
        return if checkGameOver()
        [i, j] = agent.nextAction game
        $ "##{i}\\,#{j}"
          .text (decode game.nextPlayer).toLowerCase()
          .highlight()
        game = game.play [i, j]
        next()

  humanPlayer = ->
    int = (s) -> parseInt s, 10
    parseId = (text) ->
      match = text.match /(\d),(\d)/
      [(int match[1]), (int match[2])]
    play: ->
      unplayable()
      markWins()
      return if checkGameOver()
      for [i,j] in game.possibleActions()
        $ "##{i}\\,#{j}"
          .addClass 'playable-tile'
      $ '.playable-tile'
        .on 'click', ->
          tile = ($ this)
          tile.text (decode game.nextPlayer).toLowerCase()
          game = game.play parseId tile.get(0).id
          next()

  setup = ->
    playerX = humanPlayer()
    playerO = computerPlayer()
    $ '.tile'
      .removeClass 'x-won-tile'
      .removeClass 'o-won-tile'
      .text ''
    game = new UltimateTicTacToe
    game.lastPlayedPosition = null
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
