// var Util, window, XMLHttpRequest;
(function (options) {
  // TODO: Implement / borrow config.extend function.
  options = options || {};

  if (!window.WebSocket && window.MozWebSocket) {
    window.WebSocket = window.MozWebSocket;
  }

  var defaultTransport = window.WebSocket ? 'websocket' : 'jsonp';

  var JSONP = function (target) {
    this.url = target;

    // Poll in the background. This function needs to be accessible,
    // but I don't like polluting the global namespace. :P
    var self = this;
    this.buffer = [];
    this.pollFunc = function () {
      if (self.poll) {
        delete window[self.poll.id];
        window.clearTimeout(self.poll.timeout);
        window.document.head.removeChild(self.poll.el);
      }
      var args = Util.arrayCopy(arguments);
      if (args.length) {
        if (self.onmessage) {
          args.map(self.onmessage);
          self.buffer.map(self.onmessage);
          self.buffer = [];
        }
      }
      self.poll = {
        el: window.document.createElement('script'),
        id: self.poll ? self.poll.id + 1 : 0
      };
      // We need a new URL every time, to avoid caching.
      self.poll.el.src = self.url + '/poll/' + self.poll.id;
      window.document.head.appendChild(self.poll.el);
      self.poll.timeout = window.setTimeout(function () {
        self.pollKill();
      }, 30000);
      window[self.poll.id] = self.pollFunc;
    };
    this.pollFunc();
  };
  JSONP.prototype.pollKill = function () {
    if (this.poll) {
      delete window[this.poll.id];
      window.document.head.removeChild(this.poll.el);
    }
    this.onclose();
  };

  JSONP.prototype.__proto__ = Util.EventEmitter;

  JSONP.prototype.send = function (data) {
    var el = window.document.createElement('script');
    // TODO: Potentially not cross-browser, according to MDN.
    // Test at some point.
    data = window.encodeURIComponent(data);
    el.src = this.url + '/' + Date.now() + '?' + data;
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
  var normalizeUrl = function (url, transport) {
    if (transport === 'websocket') {
      url = url.replace(/^http/, 'ws');
      if (url.indexOf('//') === 0) {
        url = 'ws:' + url;
      }
    }
    url = url.replace(/\/$/, '');
    return url;
  };


  var Socket = function (transport, url) {
    var self = this;
    this._callbacks = [];
    this._callbacks.__proto__ = Socket.defaultCallbacks;
    this.id = Util.generateRandomString();
    this.url = normalizeUrl(url, transport) + '/' + transport + '/' + this.id;
    this.transport = new transports[transport](this.url);
    this.incoming = new Util.EventEmitter();
    this.transport.onopen = function () {
      if (!self.connected) {
        self.connected = true;
        self.ready();
      }
    };

    this.transport.onclose = function () {
      self.connected = false;
      self.incoming.emit('disconnect');
    };

    this.transport.onmessage = function (ev) {
      if (ev && typeof ev === 'object') {
        ev = ev.data;
      }
      self.incoming.emit.apply(self.incoming, Util.deserialize(ev));
    };
    if (transport !== 'websocket') {
      this.transport.onopen();
    }
  };

  Socket.prototype.emit = function (listener) {
    console.log(arguments);
    this.transport.send(Util.serialize(listener, arguments));
  };

  Socket.prototype.on = function () {
    this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
  };

  Socket.prototype.once = function () {
    this.incoming.once.apply(this.incoming, Util.arrayCopy(arguments));
  };

  Socket.prototype.ready = function (cb) {
    var arr = this._callbacks;
    if (typeof cb === 'function') {
      if (this.connected) {
        cb();
      } else {
        arr.push(cb);
      }
    } else {
      for (var i = 0, ll = arr.length; i < ll; i++) {
        arr[i]();
      }
    }
  };

  window.io = {
    connect: function (url, transport) {
      return new Socket(transport || defaultTransport, url);
    },
    util: Util
  };
}());
