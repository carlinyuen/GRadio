/*************************************
//
// gradio app
//
**************************************/

// express magic
var express = require('express');
var app = express();
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);
var device  = require('express-device');

var runningPortNumber = process.env.PORT;

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.set('views', __dirname +'/views');
});

// logs every request
app.use(function(req, res, next){
	console.log({method:req.method, url: req.url});
	next();
});

// Route index
app.get('/', function(req, res){
	res.render('index', {});
});

// SocketIO - setup when new socket connection is created
io.sockets.on('connection', function (socket) {

	// Set name and let people know you joined
	socket.on('setName', function (name) {
		socket.set('name', name, function () {
			io.sockets.emit('message', {
				msg:'<p class="text-muted">' + name + ' just joined!</p>'
			});
		});
	});

	// Listen for messages
	socket.on('message', function(data, callback) 
	{
		console.log(data);

		// Pass message to all connected sockets
		io.sockets.emit('message', { msg: data.msg });

		// Then call callback if exists
		if (callback) {
			callback();
		}
	});

});

// Start server
server.listen(runningPortNumber);

