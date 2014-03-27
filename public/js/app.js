/*************************************
//
// gradio app
//
**************************************/

// connect to our socket server
var socket = io.connect(window.location.href);

var app = app || {};

// On document.ready
$(function()
{
	// Element references
	var $inputField = $('#input')
		, $messages = $('#messages')
		, $sendButton = $('#send')
		, $player = $('#player')
	;

	// Navigation bar
	$('li a').click(function (event) 
	{
		event.preventDefault();	// Don't allow page change

		// Get source
		console.log('clicked:', this);
		var href = $(this).attr('href');
		console.log('href:', href);
		var newSource = getParam('source', href);
		console.log('param:', newSource);

		// Change out source of audio
		changeStation(newSource);
	});

	// Get GET query param, based on https://gist.github.com/varemenos/2531765 
	function getParam(key, source) 
	{
		var result = new RegExp(key + "=([^&]*)", "i").exec(source ? source : window.location.search); 
		return result && unescape(result[1]) || ""; 
	}

	// Switching music
	function changeStation(sourceUrl) 
	{
		console.log('changeStation:', sourceUrl);

		// Clear old source elements
		$player[0].pause();
		$('source').remove();

		// Add new ones
		$.each(sourceUrl.split(','), function(index, source) {
			if (source && source.length) {
				$(document.createElement('source'))
					.attr('src', source)
					.attr('type', 'audio/mpeg')
					.prependTo($player)
				;
			}
		});

		// Load and play
		$player[0].load();
		$player[0].play();
	}

	// SocketIO setup
	socket.on('message', function(data)
	{
		// Create element to hold escaped text message
		$(document.createElement('p')).text(data.msg).appendTo($messages);

		// Scroll to bottom
		$messages.scrollTop($messages[0].scrollHeight - $messages.height());
	});
	
	// Send button click
	$sendButton.click(function(e)
	{
		var message = $inputField.val();
		if (message.length) {
			socket.emit('message', { 
				msg: message 
			}, function(data) {
				$inputField.val('');
			});
		}
	});

	// Send button enter press
	$inputField.keydown(function (e) {
	    if (e.keyCode == 13) {
	        $sendButton.trigger('click');
	    }
	});
	
	// Get any query param source and start audio, else go with first nav button
	var source = getParam('source');
	if (source) {
		console.log('onload source:', source);
		changeStation(source);
	} else {
		$('li a').get(0).click();
	}

});
