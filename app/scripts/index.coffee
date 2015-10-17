$ = jQuery

{MinimaxAgent} = require 'aye-aye'
{X, O, decode} = require 'aye-aye/lib/games/bin-tic-tac-toe'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

$ ->

  game = null

  int = (s) -> parseInt s, 10

  parseId = (text) ->
    match = text.match /(\d),(\d)/
    [(int match[1]), (int match[2])]

  setup = ->
    ($ '.tile')
      .removeClass 'x-won-tile'
      .removeClass 'o-won-tile'
      .text ''
    game = new UltimateTicTacToe
    step()

  step = ->

    ($ '.tile')
      .removeClass 'playable-tile'
      .off 'click'

    for i in [0...9]
      for j in game.winOn i
        wonClass = if (game.at i, j) is X then 'x-won-tile' else 'o-won-tile'
        ($ "##{i}\\,#{j}").addClass wonClass

    if game.isTerminal()
      ($ '#game-over-text').text switch
        when game.isWin(X) then 'X Wins!'
        when game.isWin(O) then 'O Wins!'
        else 'Draw!'
      ($ '#game-over')
        .on 'hidden.bs.modal', -> setup()
        .modal 'show'
      return

    for [i,j] in game.possibleActions()
      ($ "##{i}\\,#{j}").addClass 'playable-tile'

    ($ '.playable-tile')
      .on 'click', ->
        tile = ($ this)
        tile.text (decode game.nextPlayer).toLowerCase()
        game = game.play parseId tile.get(0).id
        step()

  setup()
