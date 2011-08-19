var Util = require('../util');
var Transport = require('../transport');

// This is for both JSONP- and XHR-polling.
var Polling = function (modus) {
  var self = this;
  // modus refers to either XHR or JSONP.
  this.modus = modus;
  this.incoming = new Util.EventEmitter();
  this.buffer = [];
};

Polling.prototype.__proto__ = Transport.prototype;

Polling.prototype.write = function () {
  
};

exports.Polling = Polling;
