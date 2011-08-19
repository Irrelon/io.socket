var fs = require('fs');
var io = require('../../lib');
var server = require('http').createServer(function (req, res) {
  fs.readFile(__dirname + '/helloworld.html', function (err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});
server.listen(8080);

io.listen(server);

io.on('connection', function (socket) {
  socket.on('echo', function () {
    var args = [];
    for (var i = 0, ll = arguments.length; i < ll; i++) {
      args[i] = arguments[i];
    }
    args.unshift('echo');
    socket.emit.apply(socket, args);
  });
});
