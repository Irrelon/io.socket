var Util = require('./util');

var Socket = function (transport) {
  this.transport = transport;
  this.id = Util.generateRandomString();
};

// All streams are instances of EventEmitter, so all sockets should
// be, as well.
Socket.prototype.on = function (type) {
  var args = Util.arrayCopy(arguments);
  this.transport.on.apply(this.transport, args);
};

Socket.prototype.emit = function (type) {
  var args = Util.arrayCopy(arguments);
  this.transport.emit.apply(this.transport, args);
};

exports.Socket = Socket;
