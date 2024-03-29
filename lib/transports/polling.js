var Util = require('../util');
var Transport = require('../transport').Transport;

// This is for both JSONP- and XHR-polling.
var Polling = function (io, modus, id) {
  var self = this;
  // modus refers to either XHR or JSONP.
  this.modus = modus;
  this.incoming = new Util.EventEmitter();
  this.req = modus.req;
  this.buffer = [];
  this.timeout = 0;
  this.id = id;
  this.io = io;
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
    clearTimeout(self.timeout);
    self.io.disconnect(self.ioSocket);
  });
  clearTimeout(self.timeout);
  this.timeout = setTimeout(function () {
    clearTimeout(self.timeout);
    self.io.disconnect(self.ioSocket);
  }, Polling.pollTimeout);
  this.modus = new this.modus.constructor(req, res);
  this.modus.flush(this.buffer);
  this.buffer = [];
  setTimeout(function () {
    if (self.req === req) {
      self.modus.flush(this.buffer, true);
    }
  }, 20000);
};

Polling.prototype.process = function (req, res) {
  try {
    var data = Util.deserialize(req.method === 'GET' ?
                                decodeURIComponent(req.url.substr(req.url.lastIndexOf('?') + 1)) :
                                (req.method === 'POST' ? req.headers.postdata : ''));
    this.incoming.emit.apply(this.incoming, data);
    res.writeHead(200, {'Content-Type': 'text/javascript'});
    res.end();
  } catch (e) {
    console.log('Invalid request.');
    console.log(e.name);
    console.log(e.stack);
    return;
  }
};

// Must be longer than the actual poll interval.
Polling.pollTimeout = 30000;

exports.Polling = Polling;
