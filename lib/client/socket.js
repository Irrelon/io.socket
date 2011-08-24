var Util, window, XMLHttpRequest;
(function (options) {
  // TODO: Implement / borrow config.extend function.
  options = options || {};

  if (!window.WebSocket && window.MozWebSocket) {
    window.WebSocket = window.MozWebSocket;
  }

  var defaultTransport = window.WebSocket ? 'websocket' : 'jsonp';
  var Polling = function () {
    // Poll in the background. This function needs to be accessible,
    // but I don't like polluting the global namespace. :P
    var self = this;
    this.buffer = [];
    this.pollFunc = function () {
      if (self.poll) {
        self.clearPoll();
      }
      var args = Util.arrayCopy(arguments);
      if (args.length) {
        if (self.onmessage) {
          args.map(self.onmessage);
          self.buffer.map(self.onmessage);
          self.buffer = [];
        }
      }
      self.resetPoll();
      this.poll.timeout = window.setTimeout(function () {
        self.pollKill();
      }, 30000);
    };
    this.pollFunc();
  };

  Polling.prototype.__proto__ = Util.EventEmitter;

  var JSONP = function (target) {
    this.url = target;
    Polling.call(this);
  };

  JSONP.prototype.__proto__ = Polling.prototype;

  JSONP.prototype.pollKill = function () {
    if (this.poll) {
      delete window[this.poll.id];
      window.document.head.removeChild(this.poll.el);
    }
    this.onclose();
  };

  JSONP.prototype.resetPoll = function () {
    this.poll = {
      el: window.document.createElement('script'),
      id: this.poll ? this.poll.id + 1 : 0
    };
    // We need a new URL every time, to avoid caching.
    this.poll.el.src = this.url + '/poll/' + this.poll.id;
    window.document.head.appendChild(this.poll.el);
    window[this.poll.id] = this.pollFunc;
  };

  JSONP.prototype.clearPoll = function () {
    delete window[this.poll.id];
    window.clearTimeout(this.poll.timeout);
    window.document.head.removeChild(this.poll.el);
  };

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
    this.url = target;
    this.buffer = [];
    this.xhr = new XMLHttpRequest();
    this.xhr.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.responseText.length) {
          JSON.parse(this.responseText).map(self.onmessage);
          self.buffer.map(self.onmessage);
          self.buffer = [];
        }
      }
    };
    Polling.call(this);
  };

  XHR.prototype.__proto__ = Polling.prototype;

  XHR.prototype.send = function (data) {
    this.xhr.open('POST', this.url);
    this.xhr.setRequestHeader('postdata', data);
    this.xhr.send();
  };

  XHR.prototype.pollKill = function () {
    if (this.poll) {
      this.xhr.abort();
      this.poll.abort();
    }
    this.onclose();
  };

  XHR.prototype.resetPoll = function () {
    var self = this;
    var id = this.poll ? this.poll.id : 0;
    this.poll = new XMLHttpRequest();
    this.poll.id = id;
    this.poll.open('GET', this.url + '/poll/' + this.poll.id);
    this.poll.onreadystatechange = function () {
      if (this.readyState === 4) {
        if (this.responseText.length) {
          self.pollFunc.apply(self, JSON.parse(this.responseText));
        }
      }
    };
    this.poll.send();
  };

  XHR.prototype.clearPoll = function () {
    window.clearTimeout(this.poll.timeout);
  };

  // Transports are a mapping of lowercase name to constructor.
  var transports = {};

  // Constructors should all act like WebSocket, for convenience's sake.
  transports.websocket = window.WebSocket;
  transports.jsonp = JSONP;
  transports.xhr = XHR;

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
