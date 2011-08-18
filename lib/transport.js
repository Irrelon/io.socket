var Util = require('./util');

// Basically, emulate a socket.
var Transport = function () {
};

Transport.prototype.write = function () {
  this.socket.write.apply(this.socket, Util.arrayCopy(arguments));
};

Transport.prototype.__proto__ = Util.EventEmitter.prototype;

exports.Transport = Transport;
