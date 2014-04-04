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
	res.render('index');
});

// SocketIO - setup when new socket connection is created
var userCount = 6;
var recentMessages = [];
var MAX_RECENT_MESSAGES = 10;
io.sockets.on('connection', function (socket) {

	userCount++;

	// Set name and let people know you joined
	socket.on('setName', function (data, callback)
	{
		var name;
		if (!data || !data.name || !data.name.trim().length) {
			name = 'Mysterio';
		} else {
			name = data.name.trim();
		}

		// Set name and emit to others
		socket.set('name', name, function() {
			io.sockets.emit('notification', {
				msg:'<p class="text-warning">' + name + ' joined the party!</p>',
				roomCount: userCount,
				clientId: socket.id,
				action: 'connect'
			});
		});

		// Get color and send it back
		var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
		socket.set('color', color, function() {
			if (callback) {
				callback({
					name: name,
					clientId: socket.id,
					color: color,
					roomCount: userCount,
					recentMessages: recentMessages
				});
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
					}
					else
					{
						// Create message and store for recent messages
						var message = {
							msg: data.msg,
							username: name,
							clientId: socket.id,
							color: color,
							roomCount: userCount
						};
						recentMessages.push(message);
						while (recentMessages.length > MAX_RECENT_MESSAGES) {
							recentMessages.shift();
						}
						console.log('recent:', recentMessages);

						// Pass message to all connected sockets
						io.sockets.emit('message', message);
					}
				});
			}
		});

		// Then call callback if exists
		if (callback) {
			callback();
		}
	});

	// Mouse moving, add socket id info into it
	socket.on('move', function(data)
	{
		data.id = socket.id;
		io.sockets.emit('move', data);
	});

	// Disconnecting
	socket.on('disconnect', function()
	{
		userCount--;

		socket.get('name', function(err, name) {
			if (err) {
				console.log(err);
			} else {
				io.sockets.emit('notification', {
					msg:'<p class="text-info">' + name + ' left us. :o(</p>',
					roomCount: userCount,
					clientId: socket.id,
					action: 'disconnect'
				});
			}
		});
	});

});

// Start server
server.listen(runningPortNumber);

