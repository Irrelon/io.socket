var fs = require('fs');
var Socket = require('../../lib/socket').Socket;
var WebSocket = require('../../lib/transports/websocket').WebSocket;
var sockets = [];
var server = require('http').createServer(function (req, res) {
  fs.readFile(__dirname + '/helloworld.html', function (err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});
server.listen(8080);

server.on('upgrade', function (req, socket, head) {
  var s = sockets[sockets.length] = new Socket(new WebSocket(req, socket, head));
  s.on('data', function (a, b, c, d) {
    console.log(a * b * c * d);
  });
});
