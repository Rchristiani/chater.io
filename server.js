var express = require('express');
var app = express()
var http = require('http');
var server = http.createServer(app)
var io = require('socket.io')(server);

io.of('/').on('connection', function(socket) {
	socket.on('message', function(data) {
		io.emit('newMessage', data);
	});
	socket.on('disconnected', function(data) {
		io.emit('userDisconnect', data);
	});
	socket.on('connected', function(data) {
		io.emit('userConnect', data);
	})
});  

app.use(express.static('./'));

server.listen(4000);

