var Util = require('./util');

// Emulate a socket. No objects should be just instances of Transport.

var Transport = function () {
  var self = this;
  this.incoming = null;
  this.socket = null;
};

Transport.prototype.write = function () {
  this.socket.write.apply(this.socket, Util.arrayCopy(arguments));
};

Transport.prototype.emit = function (listener) {
  this.socket.write(Util.serialize(listener, arguments));
};

Transport.prototype.on = function (listener) {
  this.incoming.on.apply(this, Util.arrayCopy(arguments));
};

Transport.prototype.__proto__ = Util.EventEmitter.prototype;

exports.Transport = Transport;
