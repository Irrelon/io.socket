var Util = require('./util');
var io;

var fs = require('fs');

var defaultListeners, cache, server;
var regex = /\/(jsonp|xhr)\/(\d+)\/(poll\/)?(\d+(?:\.\d+)?)(?:\?[^\/]+)?/;

var handleResponse = function (req, res) {
  // Handle only GET requests for /nowjs/* files. Pass all other requests through
  var i;
  if (req.method === 'GET') {
    if (req.url.split('?')[0] === '/socket/socket.js') {
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      if (cache) {
        res.end(cache);
        return;
      }
      fs.readFile(__dirname + '/util.js', function (err, data) {
        cache = data;
        fs.readFile(__dirname + '/client/socket.js', function (err, data) {
          cache += data;
          res.end(cache);
        });
      });
      return;
    }
    if ((i = regex.exec(req.url))) {
      io.poll(i[1], i[2], i[3] !== undefined, req, res);
      return;
    }
  }
  // Make sure default listeners are still handled
  for (i in defaultListeners) {
    if (Util.hasProperty(defaultListeners, i)) {
      defaultListeners[i].call(server, req, res);
    }
  }
};

exports.wrap = function (self, s) {
  server = s;
  defaultListeners = server.listeners('request');
  server.removeAllListeners('request');
  server.on('request', handleResponse);
  server.on('upgrade', io.upgrade);
};

exports.initialize = function (arg) {
  io = arg;
};
