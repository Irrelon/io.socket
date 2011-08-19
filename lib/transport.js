var Util = require('./util');

// Emulate a socket. No objects should be just instances of Transport.

var Transport = function () {
  var self = this;
  this.incoming = null;
  this.outgoing = null;
};

Transport.prototype.write = function () {
  this.outgoing.write.apply(this.outgoing, Util.arrayCopy(arguments));
};

Transport.prototype.emit = function (listener) {
  this.write(Util.serialize(listener, arguments));
};

Transport.prototype.on = function (listener) {
  this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
};

exports.Transport = Transport;
