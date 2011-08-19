var Util, window, XMLHttpRequest;
(function (options) {
  // TODO: Implement / borrow config.extend function.
  options = options || {};

  if (window.MozWebSocket) {
    window.WebSocket = window.MozWebSocket;
  }

  var defaultTransport = window.WebSocket ? 'websocket' : 'jsonp';

  var JSONP = function (target) {
    this.url = target;
    this.poll = {};

    // Poll in the background. This function needs to be accessible,
    // but I don't like polluting the global namespace. :P
    this.pollFunc = function () {
      window.document.head.removeChild(this.poll.el);
      this.poll = {
        el: window.document.createElement('script'),
        id: Date.now()
      };
      // We need a new URL every time, to avoid caching.
      this.poll.el.src = this.url + '/poll/' + this.poll.id;
      window.document.head.addChild(this.poll.el);
      this.poll.timeOut = window.setTimeout(this.pollFunc, options.pollTimeout || 25000);
    };
    this.pollFunc();
  };

  JSONP.prototype.__proto__ = Util.EventEmitter;

  JSONP.prototype.send = function (data) {
    var el = window.document.createElement('script');
    // TODO: Potentially not cross-browser, according to MDN.
    // Test at some point.
    el.src = this.url + '/' + Date.now() + '/' + window.encodeURIComponent(data);
    window.document.head.appendChild(el);
    window.document.head.removeChild(el);
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
  transports.jsonp = JSONP;

  // Will eventually parse URLs like a boss, taking into account
  // transport requirements.
  var normalizeUrl = function (url) {
    return url;
  };


  var Socket = function (transport, url) {
    var self = this;
    this.url = normalizeUrl(url) + '/' + transport + '/' + Util.generateRandomString();
    this.transport = new transports[transport](this.url);
    this.incoming = new Util.EventEmitter();

    if (transport === 'websocket') {
      this.transport.onmessage = function (ev) {
        self.incoming.emit.apply(self.incoming, Util.deserialize(ev.data));
      };
    }
    this.once('ID', function (id) {
      this.id = id;
    });
  };

  Socket.prototype.emit = function (listener) {
    this.transport.send(Util.serialize(listener, arguments));
  };

  Socket.prototype.on = function () {
    this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
  };

  Socket.prototype.once = function () {
    this.incoming.once.apply(this.incoming, Util.arrayCopy(arguments));
  };

  window.io = {
    connect: function (url) {
      return new Socket(defaultTransport, url);
    },
    util: Util
  };
}());
