var Util, window, XMLHttpRequest;
(function () {
  if (window.MozWebSocket) {
    window.WebSocket = window.MozWebSocket;
  }

  var defaultTransport = window.WebSocket ? 'websocket' : 'jsonp';

  var JSONP = function (target) {
    this.url = target;
    var el = window.document.createElement('script');
    el.src = target;
    window.document.head.appendChild(el);

  };

  JSONP.prototype.__proto__ = Util.EventEmitter;

  JSONP.prototype.send = function (data) {

  };

  var XHR = function (target) {
    var self = this;
    this.xhr = new XMLHttpRequest();
    this.poll = new XMLHttpRequest();
    this.url = target;
    this.poll.onreadystatechange = this.xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        self.emit('message', this.responseText);
      }
    };
  };

  XHR.prototype.__proto__ = Util.EventEmitter.prototype;

  XHR.prototype.send = function (data) {
    this.xhr.open('GET', this.url + '?' + JSON.stringify(data));
    this.xhr.send();
  };

  // Transports are a mapping of lowercase name to constructor.
  var transports = {};

  // Constructors should all act like WebSocket, for convenience's sake.
  transports.websocket = window.WebSocket;

  // Will eventually parse URLs like a boss, taking into account
  // transport requirements.
  var normalizeUrl = function (transport, url) {
    return url;
  };


  var Socket = function (transport, url) {
    var self = this;
    normalizeUrl(transport, url);
    this.transport = new transports[transport](url);
    this.incoming = new Util.EventEmitter();

    if (transport === 'websocket') {
      this.transport.onmessage = function (ev) {
        self.incoming.emit.apply(self.incoming, Util.deserialize(ev.data));
      };
    }
  };

  Socket.prototype.emit = function (listener) {
    this.transport.send(Util.serialize(listener, arguments));
  };

  Socket.prototype.on = function () {
    this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
  };

  window.io = {
    connect: function (url) {
      var socket = new Socket(defaultTransport, url);
      return socket;
    },
    util: Util
  };
}());
