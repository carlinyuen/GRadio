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
	socket.on('setName', function (data, callback) 
	{
		var name;
		if (!data || !data.name || !data.name.trim().length) {
			name = 'Mystery wo/man';
		} else {
			name = data.name.trim();
		}

		// Set name and emit to others
		socket.set('name', name, function() {
			io.sockets.emit('notification', {
				msg:'<p class="text-warning">' + name + ' joined the fray!</p>'
			});
		});

		// Get color and send it back
		var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
		socket.set('color', color, function() {
			if (callback) {
				callback({name: name, color: color});
			}
		});
	});

	// Listen for messages
	socket.on('message', function(data, callback) 
	{
		console.log(data);

		// Get associated username
		socket.get('name', function(err, name) {
			if (err) {
				console.log(err);
			} else {
				socket.get('color', function(err, color) {
					if (err) {
						console.log(err);
					} else {
						// Pass message to all connected sockets
						io.sockets.emit('message', { msg: data.msg, username: name, color: color });
					}
				});
			}
		});

		// Then call callback if exists
		if (callback) {
			callback();
		}
	});

});

// Start server
server.listen(runningPortNumber);

