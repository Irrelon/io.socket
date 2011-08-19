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
  },
  poll: function (type, id, poll, req, res) {
    type = type.toUpperCase();
    if (!io.sockets[id]) {
      io.addSocket(new Socket(new Transports.Polling(io, new Transports[type](req, res), id)));
    }
    if (poll) {
      io.sockets[id].transport.poll(req, res);
    } else {
      io.sockets[id].transport.process(req, res);
    }
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
