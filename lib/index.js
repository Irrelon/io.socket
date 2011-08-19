var Socket = require('./socket').Socket;
var Transports = require('./transports');
var Util = require('./util');

var io = {
  sockets: {},
  listen: function (server) {
    server.on('upgrade', function (req, socket, head) {
      var s = new Socket(new Transports.WebSocket(req, socket, head));
      io.sockets[s.id] = s;
      io.emit('connection', s);
      s.on('close', function () {
        delete io.sockets[s.id];
        io.emit('disconnection', s);
      });
    });
  }
};

io.__proto__ = Util.EventEmitter.prototype;

module.exports = io;
