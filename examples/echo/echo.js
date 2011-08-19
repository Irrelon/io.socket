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
  console.log('CONNECTION!');
  socket.on('data', function () {
    console.log(arguments);
  });
});
