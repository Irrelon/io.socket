var Server = require('./server');
var Util = require('./util');
var Transports = require('./transports');
var Socket = require('./socket').Socket;

var io = {
  sockets: {},
  listen: function (server) {
    Server.wrap(io, server);
  },
  addSocket: function (s) {
    io.sockets[s.id] = s;
    io.emit('connection', s);
    s.emit('ID', s.id);
  },
  poll: function (type, req, res) {
    type = type.toUpperCase();
    var s = new Socket(new Transports.Polling(new Transports[type](io, req, res)));
    io.addSocket(s);
  },
  upgrade: function (req, socket, head) {
    var s = new Socket(new Transports.WebSocket(io, req, socket, head));
    io.addSocket(s);
  },
  disconnect: function (s) {
    if (s && io.sockets[s.id]) {
      delete io.sockets[s.id];
      io.emit('disconnection', s);
    }
  }
};

Server.initialize(io);

io.__proto__ = Util.EventEmitter.prototype;

module.exports = io;
