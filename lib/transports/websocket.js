var Util = require('../util');
var crypto = require('crypto');
var magic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
// Currently compatible with HyBi standards 07 through 10.

var WebSocket = function (req, socket, head) {
  var self = this;

  this.req = req;
  this.socket = socket;
  this.head = head;
  this.incoming = new Util.EventEmitter();

  this.emit = function (listener) {
    self.socket.write(Util.serialize(listener, arguments));
  };
  this.on = function (listener) {
    this.incoming.on.apply(this.incoming, Util.arrayCopy(arguments));
  };

  this.handshake();
  this.socket.on('data', function (data) {
    data = WebSocket.unmask(data);
    if (data === null) {
      self.socket.end();
      return;
    }
    var arr = Util.deserialize(data);
    self.incoming.emit.apply(self.incoming, arr);
  });
};

WebSocket.prototype.handshake = function () {
  var reqHead = this.req.headers;
  var headers = ['HTTP/1.1 101 ',
                 'Upgrade: WebSocket',
                 'Connection: Upgrade'
                ];
  reqHead.location = reqHead.location || 'ws';
  if (reqHead['sec-websocket-version'] === '8' ||
      reqHead['sec-websocket-version'] === '7') {
    headers[0] += 'Switching Protocols';
    var sha1 = crypto.createHash('sha1');
    sha1.update(reqHead['sec-websocket-key'] + magic);
    headers[3] = 'Sec-WebSocket-Accept: ' + sha1.digest('base64');
    headers[4] = '\r\n';
  }
  this.socket.write(headers.join('\r\n'));
};

WebSocket.unmask = function (buf) {
  var masked = buf[1] & 0x80;
  var payload = WebSocket.extractPayload(buf, masked);
  if (!masked) {
    return payload.toString('utf8');
  }
  var start = 2;
  if (payload.length > 125) {
    start += 2;
  }
  if (payload.length > 65535) {
    start += 8;
  }
  var mask = buf.slice(start, start + 4);
  for (var i = 0, ll = payload.length; i < ll; i++) {
    payload[i] ^= mask[i % 4];
  }
  if (payload.length === 2 && payload[0] === 0x03 && payload[1] === 0xE8) {
    // HyBi 07 closed connection on us.
    return null;
  }
  return payload.toString('utf8');
};

WebSocket.extractPayload = function (buf, masked) {
  var len = buf[1] & 0x7F;
  var start = 2 + 4 * (masked !== 0);
  switch (len) {
  case 126:
    len = buf[2] * 256 + buf[3];
    start += 2;
    break;
  case 127:
    // Exceeds max buffer size for node, which is 32767.
    len = 0;
    for (var i = 2; i < 10; i++) {
      len *= 256;
      len += buf[i];
    }
    start += 8;
    break;
  }
  return buf.slice(start, start + len);
};

exports.WebSocket = WebSocket;
