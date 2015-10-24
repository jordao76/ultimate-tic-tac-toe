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
    @dataChannel.onopen = => @onchannelopen()
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
      @dataChannel.onopen = => @onchannelopen()
      @dataChannel.onmessage = (e) => @onmessage JSON.parse e.data

  offer: (offerJSON) ->
    @peerConnection.setRemoteDescription new RTCSessionDescription JSON.parse offerJSON
    @peerConnection.createAnswer ((answerDesc) => @peerConnection.setLocalDescription answerDesc),
      -> console.warn "Couldn't create answer"

  send: (data) -> @dataChannel.send JSON.stringify data

module.exports = {Host, Guest}

# "console" API

codeColor = 'background: #222; color: #bada55'

h = new Host
h.onoffercreated = (offerJSON) ->
  console.log "%c#{JSON.stringify offerJSON}", codeColor
  console.log 'HOST: offer created (above), give it to your GUEST, get his answer and call: %cRTC.accept_answer(answer)', codeColor
h.onchannelopen = ->
  console.clear()
  console.log 'HOST: data channel open'
  RTC.ondatachannelopen?()
h.onmessage = (data) ->
  console.log 'HOST: got data', data
  RTC.onmessage? data

g = new Guest
g.onanswercreated = (answerJSON) ->
  console.log "%c#{JSON.stringify answerJSON}", codeColor
  console.log 'GUEST: answer created (above), give it to your HOST'
g.onchannelopen = ->
  console.clear()
  console.log 'GUEST: data channel open'
  RTC.ondatachannelopen?()
g.onmessage = (data) ->
  console.log 'GUEST: got data', data
  RTC.onmessage? data

RTC =
  be_a_host: ->
    @I_am_a_host = yes
    h.createOffer()
    console.info 'wait...'
  accept_answer: (answerJSON) ->
    h.acceptAnswer answerJSON
  be_a_guest: ->
    @I_am_a_guest = yes
    console.log 'GUEST: get an offer from your HOST and call: %cRTC.receive_offer(offer)', codeColor
  receive_offer: (offerJSON) ->
    g.offer offerJSON
    console.info 'wait...'
  send_message: (m) ->
    if @I_am_a_host then h.send m else g.send m
  greet: ->
    console.log 'To play with a remote peer, start a match with %cRTC.be_a_host()', codeColor
    console.log 'or accept a challenge with %cRTC.be_a_guest()', codeColor

module.exports.RTC = RTC
