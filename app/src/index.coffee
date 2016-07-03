# coffeelint: disable=max_line_length

$ = jQuery

{X, O, decode} = require 'aye-aye/lib/games/bin-tic-tac-toe'
{UltimateTicTacToe} = require 'aye-aye/lib/games/ultimate-tic-tac-toe'

{showSpinner, hideSpinner} = require './spinner'
require './highlight'

{RTC} = require './web-rtc'

$ ->

  game = null
  lastAction = null

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
    endText = switch
      when game.isWin(X) then 'X Wins!'
      when game.isWin(O) then 'O Wins!'
      else 'Draw!'
    $ '#end-text'
      .text endText
    $ '#modal-game-over'
      .modal('show')
    yes

  playerText = -> (decode game.nextPlayer).toLowerCase()

  playAction = (action) ->
    [i, j] = action
    hideSpinner()
    $ "##{i}\\,#{j}"
      .text playerText()
      .highlight()
    game = game.play action
    lastAction = action
    next()

  # player :: {
  #   setup : (done: ->) ->
  #   teardown : ->
  #   play : ->
  # }

  playerX = null
  playerO = null

  next = ->
    unplayable()
    markWins()
    player = if game.nextPlayer is X then playerX else playerO
    player.play()

  players =
    human: -> humanPlayer()
    peer: -> remotePlayer()
    'starter AI': -> computerPlayer 'monte-carlo', 500
    'smart AI': -> computerPlayer 'minimax', 3

  createPlayerX = ->
    playerName = ($ '#btn-player-x').text()
    players[playerName]()
  createPlayerO = ->
    playerName = ($ '#btn-player-o').text()
    players[playerName]()

  swapPlayers = ->
    $x = $ '#btn-player-x'
    $o = $ '#btn-player-o'
    tmp = $x.text()
    $x.text $o.text()
    $o.text tmp

  $ '.player'
    .on 'click', ->
      $player = $ this
      playerFor = $player.data 'player-for'
      $btn = $ "#btn-player-#{playerFor}"
      playerName = $player.text()
      currentPlayerName = $btn.text()
      if currentPlayerName isnt playerName
        $btn.text playerName
        setup()

  humanPlayer = ->
    int = (s) -> parseInt s, 10
    parseAction = (text) ->
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
          action = parseAction $tile.get(0).id
          playAction action

  computerPlayer = (agentName = 'minimax', depth = 3) ->
    worker = new Worker 'src/ai-worker.min.js'
    setup: (done) ->
      worker.onmessage = (e) -> playAction e.data.action
      worker.postMessage command: 'setup', args: {agentName, depth}
      done()
    play: ->
      return if checkGameOver()
      playable()
      showSpinner()
      worker.postMessage command: 'play', args: {lastAction}
    teardown: -> worker.terminate()

  $.fn.enable = (v = yes) -> ($ this).prop 'disabled', not v
  RTC.greet()
  RTC.ondatachannelopen = ->
    [xPlayer, oPlayer] =
      if RTC.isHost then ['human', 'peer'] else ['peer', 'human']
    $ '#btn-player-x'
      .text xPlayer
      .enable no
    $ '#btn-player-o'
      .text oPlayer
      .enable no
    setup()
  RTC.ondisconnected = ->
    $ '#btn-player-x'
      .text 'human'
      .enable()
    $ '#btn-player-o'
      .text 'smart AI'
      .enable()
    setup()

  remotePlayer = ->
    sendNew = -> RTC.send "new"
    ($ '#btn-new-game').on 'click', sendNew
    RTC.onmessage = (data) ->
      if data is "new" then newGame() else playAction data
    setup: (done) -> done()
    play: ->
      unless checkGameOver()
        playable()
        showSpinner()
      RTC.send lastAction if lastAction?
    teardown: -> ($ '#btn-new-game').off 'click', sendNew

  setup = ->
    teardown()
    game = new UltimateTicTacToe
    game.lastPlayedPosition = null # start with the full board open
    lastAction = null
    [playerX, playerO] = [createPlayerX(), createPlayerO()]
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

  newGame = ->
    swapPlayers()
    setup()

  $ '#btn-new-game'
    .on 'click', newGame

  setup()
