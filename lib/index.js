var Socket = require('./socket').Socket;
var Transports = require('./transports');
var Util = require('./util');
var cache;

var io = {
  sockets: {},
  listen: function (server) {
    var handleResponse, defaultListeners;
    handleResponse = function (request, response) {
      // Handle only GET requests for /nowjs/* files. Pass all other requests through
      var i;
      if (request.method === 'GET') {

        // Detect if request involves the now.js file
        if (request.url.split('?')[0] === '/socket/socket.js') {
          response.writeHead(200, {'Content-Type': 'text/javascript'});
          if (cache) {
            response.end(cache);
            return;
          }
          require('fs').readFile(__dirname + '/util.js', function (err, data) {
            cache = data;
            response.write(cache);
            require('fs').readFile(__dirname + '/client/socket.js', function (err, data) {
              cache += data;
              response.end(cache);
            });
          });
        } else {
          // Make sure default listeners are still handled
          for (i in defaultListeners) {
            if (Util.hasProperty(defaultListeners, i)) {
              defaultListeners[i].call(server, request, response);
            }
          }
        }
      } else {
        for (i in defaultListeners) {
          // Make sure default listeners are still handled
          if (Util.hasProperty(defaultListeners, i)) {
            defaultListeners[i].call(server, request, response);
          }
        }
      }
    };
    defaultListeners = server.listeners('request');
    server.removeAllListeners('request');
    server.on('request', handleResponse);

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
