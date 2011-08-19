var Util, window, XMLHttpRequest;
var arrayCopy = function (arg, index) {
  index = index || 0;
  var arr = [];
  for (var i = index, ll = arg.length; i < ll; i++) {
    arr[i] = arg[i];
  }
  return arr;
};

if (window.MozWebSocket) {
  window.WebSocket = window.MozWebSocket;
}

var defaultTransport = window.WebSocket ? 'websocket' : 'jsonp';

var JSONP = function (target) {
  this.url = target;
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
transports['ws'] = window.WebSocket;

