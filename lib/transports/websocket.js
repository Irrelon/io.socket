var Util = require('../util');
var Transport = require('../transport').Transport;
var crypto = require('crypto');

var magic = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
var regex = /\/websocket\/(\d+)$/;

// Compatible with all major WebSocket implementations.
var WebSocket = function (io, req, socket, head) {
  var self = this;

  this.req = req;
  this.outgoing = this.socket = socket;
  this.head = head;
  this.incoming = new Util.EventEmitter();
  this.version = req.headers['sec-websocket-version'] || '0';
  this.buffer = [];

  this.id = regex.exec(req.url)[1];

  this.handshake();

  this.socket.on('data', function (data) {
    if (this.version !== '0') {
      if (data[0] & 0x70) {
        self.destroy('Encountered error', data[0] & 0x70);
        return;
      }
      data = WebSocket.unmask(data);
    } else {
      if (data[0] !== 0) {
        self.destroy('');
        return;
      }
      data = data.toString('utf8', 1, data.length - 1);
    }
    if (data === null) {
      self.destroy('User disconnected');
      return;
    }
    var arr = Util.deserialize(data);
    if (!arr) {
      return;
    }
    self.incoming.emit.apply(self.incoming, arr);
  });

  socket.on('close', function () {
    io.disconnect(self.ioSocket);
    socket.destroy();
  });
  socket.on('error', function () {
    io.disconnect(self.ioSocket);
    socket.destroy();
  });
  socket.on('end', function () {
    io.disconnect(self.ioSocket);
    socket.destroy();
  });

};

WebSocket.prototype.__proto__ = Transport.prototype;

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
    start += 6;
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

WebSocket.frame = function (opcode, data) {
  var startOffset = 2, secondByte = data.length, buf;
  if (data.length > 125) {
//    opcode = 0x81;
    startOffset += 2;
    secondByte = 126;
  }
  if (data.length > 65536) {
    startOffset += 6;
    secondByte = 127;
  }
  buf = new Buffer(data.length + startOffset, 'utf8');
  buf[0] = opcode;
  buf[1] = secondByte;
  switch (secondByte) {
  case 126:
    buf[2] = data.length >>> 8;
    buf[3] = data.length % 256;
    break;
  case 127:
    for (var i = 6; i > 2; i--) {
      buf[i] = secondByte % 256;
      secondByte >>>= 8;
    }
  }
  buf.write(data, startOffset, 'utf8');
  return buf;
};

WebSocket.prototype.flush = function () {

};


WebSocket.prototype.write = function (data) {
  var buf;
  if (this.version !== '0') {
    // Lock, add to buffer, flush buffer, unlock. Also, chunk.
    buf = WebSocket.frame(0x81, data);
  } else {
    buf = new Buffer(data.length + 2, 'utf8');
    buf[0] = 0x00;
    buf.write(data, 1, 'utf8');
    buf[data.length + 1] = 0xFF;
    // Also, chunk as necessary in here.
  }
  this.socket.write(buf);
};

WebSocket.prototype.destroy = function (reason) {
  console.log('Destroying websocket connection:', reason);
  this.socket.destroy();
};

WebSocket.prototype.handshake = function () {
  var reqHead = this.req.headers;
  var headers = ['HTTP/1.1 101 ',
                 'Upgrade: WebSocket',
                 'Connection: Upgrade'];
  var protocol = this.socket.encrypted ? 'wss' : 'ws';
  reqHead.location = reqHead.location ||
    (protocol + '://' + reqHead.host + this.req.url);
  if (this.version !== '0') {
    headers[0] += 'Switching Protocols';
    var sha1 = crypto.createHash('sha1');
    sha1.update(reqHead['sec-websocket-key'] + magic);
    headers[3] = 'Sec-WebSocket-Accept: ' + sha1.digest('base64');
    headers[4] = '\r\n';
  } else if (reqHead['sec-websocket-key1']) {
    headers[0] += 'WebSocket Protocol Handshake';
    headers[3] = 'Sec-WebSocket-Origin: ' + reqHead.origin;
    headers[4] = 'Sec-WebSocket-Location: ' + reqHead.location;
    headers[5] = 'Sec-WebSocket-Protocol: ' + protocol;
    headers[6] = '\r\n';
  }
  this.socket.write(headers.join('\r\n'));
  this.proveReception();
};

WebSocket.prototype.proveReception = function () {
  // Essentially taken from Socket.IO.
  var self = this,
      k1 = this.req.headers['sec-websocket-key1'],
      k2 = this.req.headers['sec-websocket-key2'];

  if (k1 && k2) {
    var md5 = crypto.createHash('md5');
    [k1, k2].forEach(function (k) {
      var n = parseInt(k.replace(/[^\d]/g, ''), 10),
          spaces = k.replace(/[^ ]/g, '').length;
      if (spaces === 0 || n % spaces !== 0) {
        self.end();
        return;
      }
      n /= spaces;
      md5.update(String.fromCharCode(
        n >>> 24 & 0xFF,
        n >>> 16 & 0xFF,
        n >>> 8  & 0xFF,
        n       & 0xFF));
    });
    md5.update(this.head.toString('binary'));
    try {
      this.socket.write(md5.digest('binary'), 'binary');
    } catch (e) {
      this.destroy();
    }
  }
};

exports.WebSocket = WebSocket;
