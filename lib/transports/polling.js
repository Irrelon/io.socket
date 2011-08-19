var Util = require('../util');
var Transport = require('../transport').Transport;

// This is for both JSONP- and XHR-polling.
var Polling = function (io, modus, id) {
  var self = this;
  // modus refers to either XHR or JSONP.
  this.modus = modus;
  this.incoming = new Util.EventEmitter();
  this.buffer = [];
  this.timeout = 0;
  this.id = id;
};

Polling.prototype.__proto__ = Transport.prototype;

Polling.prototype.write = function (data) {
  this.buffer.push(data);
  this.modus.flush(this.buffer);
  this.buffer = [];
};

Polling.prototype.poll = function (req, res) {
  var self = this;
  req.on('close', function () {
    clearTimeout(this.timeout);
    self.io.disconnect(self.ioSocket);
  });
  clearTimeout(this.timeout);
  this.timeout = setTimeout(function () {
    clearTimeout(self.timeout);
    self.io.disconnect(self.ioSocket);
  }, Polling.pollTimeout);
  this.modus.flush(this.buffer);
  this.buffer = [];
};

Polling.prototype.process = function (req, res) {
  try {
    var data = req.url.substr(req.url.lastIndexOf('?') + 1);
    this.incoming.emit.apply(this.incoming, Util.deserialize(decodeURIComponent(data)));
  } catch (e) {
    console.log('Invalid request.');
    return;
  }
};

// Must be longer than the actual poll interval.
Polling.pollTimeout = 30000;

exports.Polling = Polling;
