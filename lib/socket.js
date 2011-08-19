var Util = require('./util');

var Socket = function (transport) {
  transport.ioSocket = this;
  this.transport = transport;
  this.handshake = transport.req;
  this.id = transport.id;
};

Socket.prototype.on = function (type) {
  var args = Util.arrayCopy(arguments);
  this.transport.on.apply(this.transport, args);
};

Socket.prototype.emit = function (type) {
  this.transport.write(Util.serialize(type, arguments));
};

exports.Socket = Socket;
