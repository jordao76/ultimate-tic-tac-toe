const RTCPeerConnection =
  window.RTCPeerConnection ||
  window.mozRTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.msRTCPeerConnection;
const RTCSessionDescription =
  window.RTCSessionDescription ||
  window.mozRTCSessionDescription ||
  window.webkitRTCSessionDescription ||
  window.msRTCSessionDescription;

const configuration = { iceServers: [{ url: 'stun:23.21.150.121' }] };
const constraints = { optional: [{ DtlsSrtpKeyAgreement: true }] };

class Host {
  constructor() {
    this.peerConnection = new RTCPeerConnection(configuration, constraints);
    this.dataChannel = null;

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate === null) {
        this.onoffercreated(JSON.stringify(this.peerConnection.localDescription));
      }
    };
  }

  setupDataChannel() {
    this.dataChannel = this.peerConnection.createDataChannel('data', { reliable: true });
    this.dataChannel.onopen = () => {
      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection.iceConnectionState === 'disconnected') {
          this.ondisconnected?.();
        }
      };
      this.onchannelopen();
    };
    this.dataChannel.onmessage = (e) => this.onmessage(JSON.parse(e.data));
  }

  createOffer() {
    this.setupDataChannel(); // important: create data channel before the offer
    this.peerConnection.createOffer(
      (offerDesc) => this.peerConnection.setLocalDescription(offerDesc),
      () => console.warn("Couldn't create offer"),
    );
  }

  acceptAnswer(answerJSON) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(answerJSON)));
  }

  send(data) {
    this.dataChannel.send(JSON.stringify(data));
  }
}

class Guest {
  constructor() {
    this.peerConnection = new RTCPeerConnection(configuration, constraints);
    this.dataChannel = null;

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate === null) {
        this.onanswercreated(JSON.stringify(this.peerConnection.localDescription));
      }
    };

    this.peerConnection.ondatachannel = (e) => {
      this.dataChannel = e.channel || e;
      this.dataChannel.onopen = () => {
        this.peerConnection.oniceconnectionstatechange = () => {
          if (this.peerConnection.iceConnectionState === 'disconnected') {
            this.ondisconnected?.();
          }
        };
        this.onchannelopen();
      };
      this.dataChannel.onmessage = (e) => this.onmessage(JSON.parse(e.data));
    };
  }

  offer(offerJSON) {
    this.peerConnection.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerJSON)));
    this.peerConnection.createAnswer(
      (answerDesc) => this.peerConnection.setLocalDescription(answerDesc),
      () => console.warn("Couldn't create answer"),
    );
  }

  send(data) {
    this.dataChannel.send(JSON.stringify(data));
  }
}

module.exports = { Host, Guest };

// WebRTC with Firebase as a signaling service

const RTC = {
  greet() {
    window.RTC = RTC;
    console.log(
      'To play with a remote peer, start a match with %cRTC.host()',
      'background: #222; color: #bada55',
    );
  },

  host() {
    this.isHost = true;
    const host = new Host();
    const key = (Math.random() * 99999 + 10000) | 0;
    const gameRef = new Firebase('https://ut3.firebaseio.com/' + key);
    host.onoffercreated = (offerJSON) => {
      gameRef.onDisconnect().remove();
      gameRef.set({ offer: JSON.parse(offerJSON) });
      window.location.hash = key;
      console.log('Give this URL to the other player:');
      console.log(window.location.href);
      gameRef.on('value', (snap) => {
        const data = snap.val();
        if (!data?.answer) return;
        host.acceptAnswer(JSON.stringify(data.answer));
      });
    };
    host.ondisconnected = () => {
      console.log('peer disconnected!');
      window.location.hash = '';
      RTC.ondisconnected?.();
    };
    host.onchannelopen = () => {
      console.log('channel open');
      RTC.send = (m) => host.send(m);
      gameRef.off('value');
      RTC.ondatachannelopen?.();
    };
    host.onmessage = (data) => {
      console.log('HOST: got data', data);
      RTC.onmessage?.(data);
    };
    host.createOffer();
  },

  guest() {
    const hash = window.location.hash;
    if (!hash) return;
    this.isGuest = true;
    const gameRef = new Firebase('https://ut3.firebaseio.com/' + hash.substring(1));
    const guest = new Guest();
    guest.onanswercreated = (answerJSON) => {
      gameRef.update({ answer: JSON.parse(answerJSON) });
    };
    guest.ondisconnected = () => {
      console.log('peer disconnected!');
      window.location.hash = '';
      RTC.ondisconnected?.();
    };
    guest.onchannelopen = () => {
      console.log('channel open');
      RTC.send = (m) => guest.send(m);
      RTC.ondatachannelopen?.();
    };
    guest.onmessage = (data) => {
      console.log('GUEST: got data', data);
      RTC.onmessage?.(data);
    };
    gameRef.once('value', (snap) => {
      const data = snap.val();
      if (data?.offer) {
        guest.offer(JSON.stringify(data.offer));
      } else {
        console.log('HOST offer not found for game ' + hash);
        window.location.hash = '';
      }
    });
  },
};

jQuery(() => RTC.guest());

module.exports.RTC = RTC;
