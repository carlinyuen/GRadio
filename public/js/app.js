/*************************************
//
// GRadio by Carlin Yue
//
**************************************/

// connect to our socket server
var socket = io.connect(window.location.href);

var app = app || {};

// On document.ready
$(function()
{
	// Constants
	var TIME_CHATBOX_ANIMATION = 400
		, TIME_CHATBOX_HIDE = 1000 * 6
	;

	// Element references
	var $form = $('#chatBox')
		, $inputField = $('#input')
		, $messages = $('#messages')
		, $sendButton = $('#send')
		, $player = $('#player')
	;

	// Variables
	var userId
		, username
		, color 
		, hideChatboxTimer
	;

	// Navigation bar
	$('li a').click(function (event) 
	{
		event.preventDefault();	// Don't allow page change

		// Get source
		var newSource = getParam('source', $(this).attr('href'));

		// Change out source of audio
		changeStation(newSource);

		// Update to active li element
		$('.navbar').find('li').removeClass('active');
		$(this).parent('li').addClass('active');
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

		// Load and play - use setTimeout to 'async' it
		setTimeout(function() {
			$player[0].load();
			$player[0].play();
		}, 0);
	}

	// Update listener count
	function updateRoomCount(roomCount) {
		$form.attr('data-content', roomCount);
	}

	// SocketIO setup
	socket.on('message', function(data)
	{
		// Create element to hold escaped text message
		$(document.createElement('p')).text(data.msg)
			.prepend($(document.createElement('strong'))
				.text(data.username)
				.css({ color: (data.clientId === userId) ? color : data.color })
			)
			.appendTo($messages);

		// Update listener count
		updateRoomCount(data.roomCount);

		// Scroll to bottom
		$messages.scrollTop($messages[0].scrollHeight - $messages.height());
	});
	socket.on('notification', function(data)
	{
		// Only come from server, so theoretically safe to render html
		$messages.html($messages.html() + data.msg);
		
		// Update listener count
		updateRoomCount(data.roomCount);

		// Scroll to bottom
		$messages.scrollTop($messages[0].scrollHeight - $messages.height());
	});
	
	// Send button click
	$sendButton.click(function(e)
	{
		clearTimeout(hideChatboxTimer);	// Don't mess with it if user is messing with it
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
		clearTimeout(hideChatboxTimer);	// Don't mess with it if user is messing with it
		if (e.keyCode == 13) {
			$sendButton.trigger('click');
		}
	});

	// Prevent form submit
	$form.submit(function(event) {
		event.preventDefault();
	});

	// Toggle show / hide of chat box
	var chatCollapsed = false;
	function toggleChatBox(event) 
	{
		clearTimeout(hideChatboxTimer);	// Don't reopen it
		chatCollapsed = !chatCollapsed;	// Toggle closed status
		$form.animate({
			bottom: (chatCollapsed ? -$form.height() : 0) 
		}, TIME_CHATBOX_ANIMATION);
	}

	// Collapse button
	$('.collapseButton').click(toggleChatBox);

	// Default volume to lower level when first loaded
	$player[0].volume = 0.33;
	
	// Get any query param source and start audio
	var source = getParam('source');
	if (source) {
		console.log('onload source:', source);
		changeStation(source);
	} else {	// Start default first station
		$('li a')[0].click();
	}

	// Default to collapsed, do this after delay if user doesn't use it
	hideChatboxTimer = setTimeout(toggleChatBox, TIME_CHATBOX_HIDE);

	// Ask for username
	var name = prompt('By what name shall thy presence be known? (optional)');
	socket.emit('setName', { name: name }, function(data) 
	{
		console.log('setName:', data);

		// Setup user prefs
		userId = data.clientId;
		username = data.name;
		color = data.color;

		// Update listener count
		updateRoomCount(data.roomCount);
	});

});
