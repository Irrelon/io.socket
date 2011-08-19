var Util = require('./util');

// Emulate a socket. No objects should be just instances of Transport.

var Transport = function () {
  var self = this;
  this.incoming = null;
  this.outgoing = null;
};

Transport.prototype.write = function (arg) {
  throw new Error('WRITE NOT IMPLEMENTED.');
};

Transport.prototype.on = function (listener) {
  this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
};

exports.Transport = Transport;
