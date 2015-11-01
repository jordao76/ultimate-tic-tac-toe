# coffeelint: disable=max_line_length

RTCPeerConnection =
  window.RTCPeerConnection or
  window.mozRTCPeerConnection or
  window.webkitRTCPeerConnection or
  window.msRTCPeerConnection
RTCSessionDescription =
  window.RTCSessionDescription or
  window.mozRTCSessionDescription or
  window.webkitRTCSessionDescription or
  window.msRTCSessionDescription

configuration = iceServers: [url: 'stun:23.21.150.121']
constraints = optional: [DtlsSrtpKeyAgreement: true]

class Host

  constructor: ->
    @peerConnection = new RTCPeerConnection configuration, constraints
    @dataChannel = null

    @peerConnection.onicecandidate = (e) =>
      if e.candidate is null
        @onoffercreated JSON.stringify @peerConnection.localDescription

  setupDataChannel: ->
    @dataChannel = @peerConnection.createDataChannel 'data', reliable: true
    @dataChannel.onopen = =>
      @peerConnection.oniceconnectionstatechange = =>
        if @peerConnection.iceConnectionState is 'disconnected'
          @ondisconnected?()
      @onchannelopen()
    @dataChannel.onmessage = (e) => @onmessage JSON.parse e.data

  createOffer: ->
    @setupDataChannel() # note: it's important to create the data channel before creating the offer
    @peerConnection.createOffer ((offerDesc) => @peerConnection.setLocalDescription offerDesc),
      -> console.warn "Couldn't create offer"

  acceptAnswer: (answerJSON) ->
    @peerConnection.setRemoteDescription new RTCSessionDescription JSON.parse answerJSON

  send: (data) -> @dataChannel.send JSON.stringify data

class Guest

  constructor: ->
    @peerConnection = new RTCPeerConnection configuration, constraints
    @dataChannel = null

    @peerConnection.onicecandidate = (e) =>
      if e.candidate is null
        @onanswercreated JSON.stringify @peerConnection.localDescription

    @peerConnection.ondatachannel = (e) =>
      @dataChannel = e.channel or e
      @dataChannel.onopen = =>
        @peerConnection.oniceconnectionstatechange = =>
          if @peerConnection.iceConnectionState is 'disconnected'
            @ondisconnected?()
        @onchannelopen()
      @dataChannel.onmessage = (e) => @onmessage JSON.parse e.data

  offer: (offerJSON) ->
    @peerConnection.setRemoteDescription new RTCSessionDescription JSON.parse offerJSON
    @peerConnection.createAnswer ((answerDesc) => @peerConnection.setLocalDescription answerDesc),
      -> console.warn "Couldn't create answer"

  send: (data) -> @dataChannel.send JSON.stringify data

module.exports = {Host, Guest}

# WebRTC with Firebase as a signaling service

RTC =

  greet: ->
    window.RTC = RTC
    console.log 'To play with a remote peer, start a match with %cRTC.host()',
      'background: #222; color: #bada55'

  host: ->
    @isHost = yes
    host = new Host
    key = Math.random()*99999+10000|0
    gameRef = new Firebase 'https://ut3.firebaseio.com/' + key
    host.onoffercreated = (offerJSON) ->
      gameRef.onDisconnect().remove()
      gameRef.set offer: JSON.parse offerJSON
      window.location.hash = key
      console.log 'Give this URL to the other player:'
      console.log window.location.href
      gameRef.on 'value', (snap) ->
        data = snap.val()
        return unless data?.answer?
        host.acceptAnswer JSON.stringify data.answer
    host.ondisconnected = ->
      console.log 'peer disconnected!'
      window.location.hash = ''
      RTC.ondisconnected?()
    host.onchannelopen = ->
      console.log 'channel open'
      RTC.send = (m) -> host.send m
      gameRef.off 'value'
      RTC.ondatachannelopen?()
    host.onmessage = (data) ->
      console.log 'HOST: got data', data
      RTC.onmessage? data
    host.createOffer()

  guest: ->
    hash = window.location.hash
    return unless hash
    @isGuest = yes
    gameRef = new Firebase 'https://ut3.firebaseio.com/' + hash.substring 1
    guest = new Guest
    guest.onanswercreated = (answerJSON) ->
      gameRef.update answer: JSON.parse answerJSON
    guest.ondisconnected = ->
      console.log 'peer disconnected!'
      window.location.hash = ''
      RTC.ondisconnected?()
    guest.onchannelopen = ->
      console.log 'channel open'
      RTC.send = (m) -> guest.send m
      RTC.ondatachannelopen?()
    guest.onmessage = (data) ->
      console.log 'GUEST: got data', data
      RTC.onmessage? data
    gameRef.once 'value', (snap) ->
      data = snap.val()
      if data?.offer?
        guest.offer JSON.stringify data.offer
      else
        console.log 'HOST offer not found for game ' + hash
        window.location.hash = ''

jQuery -> RTC.guest()

module.exports.RTC = RTC
