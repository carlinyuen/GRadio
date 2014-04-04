// connect to our socket server
var socket = io.connect(window.location.href);

var app = app || {};

// On document.ready
$(function()
{
	// Constants
	var TIME_CHATBOX_ANIMATION = 400
		, TIME_CHATBOX_HIDE = 1000
		, TIME_CHATBOX_JIGGLE = 50
		, TIME_REFRESH_RATE = 50
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
	;

	// Click anywhere on background to mute / unmuet
	$('body').click(function(event) {
		$player[0].muted = !$player[0].muted;
	});

	// Rate limit events
	var rateLimit = function(callback)
	{
		var rateHandler;
		if (!rateHandler) {
			callback();
			rateHandler = setTimeout(function() {
				rateHandler = null;
			}, TIME_REFRESH_RATE);
		}
	};

	// Follow mouse around
	$(document).on('mousemove,touchmove', function(event) {
		if (socket) {
			rateLimit(function() {
				socket.emit('move', {
					x: event.pageX,
					y: event.pageY,
					w: $(window).width(),
					h: $(window).height()
				});
			});
		}
	});

	// Navigation bar
	$('li a').click(function(event)
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

	// Branding click
	$('.navbar-brand').click(function(event) {
		alert("Welcome to Carlin's favorite free online radio stations! Feel free to stick around and say hi in the chatter box.");
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

	// Add message to message view
	function addMessage($html)
	{
		// Add message
		$messages.append($html);

		// Scroll to bottom
		$messages.scrollTop($messages[0].scrollHeight - $messages.height());

		// Jiggle chatbox if hidden
		if (chatCollapsed) {
			$form.animate({
				bottom: -($form.height() - 6)
			}, TIME_CHATBOX_JIGGLE, 'linear', function() {
				$form.animate({
					bottom: -($form.height())
				}, TIME_CHATBOX_JIGGLE, 'linear');
			});
		}
	}

	// Message received
	function messageReceived(data)
	{
		console.log('messageReceived:', data);

		// Create element to hold escaped text message
		addMessage($(document.createElement('p')).text(data.msg)
			.prepend($(document.createElement('strong'))
				.text(data.username)
				.css({ color: (data.clientId === userId) ? color : data.color })
			));

		// Update listener count
		updateRoomCount(data.roomCount);
	}

	// Notification received
	function notificationReceived(data)
	{
		// Only come from server, so theoretically safe to render html
		addMessage(data.msg);

		// Update listener count
		updateRoomCount(data.roomCount);

		// Create / destroy cursors
		if (data.action == 'connect') {
			$(document.createElement('div'))
				.addClass('cursor')
				.attr('id', data.clientId)
				.appendTo('body');
		}
		if (data.action == 'disconnect') {
			$('#' + data.clientId).fadeOut('fast', function() {
				$(this).remove();
			});
		}
	}

	// Move mouse cursor
	var moveCursor = function(data)
	{
		$('#' + data.clientId).css({
			left: (($(window).width() - data.w) / 2 + data.x) + 'px',
			top: data.y + 'px',
		});
	};

	// SocketIO setup
	socket.on('message', messageReceived);
	socket.on('notification', notificationReceived);
	socket.on('move', moveCursor);

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

	// Prevent form submit
	$form.submit(function(event) {
		event.preventDefault();
	});

	// Toggle show / hide of chat box
	var chatCollapsed = false;
	function toggleChatBox(event)
	{
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
	}

	// Don't ask for username
	socket.emit('setName', { name: null }, function(data)
	{
		console.log('setName:', data);

		// Setup user prefs
		userId = data.clientId;
		username = data.name;
		color = data.color;

		// Add recent messages
		console.log('recent:', data.recentMessages);
		for (var i = 0, l = data.recentMessages.length; i < l; ++i) {
			messageReceived(data.recentMessages[i]);
		}

		// Update listener count
		updateRoomCount(data.roomCount);
	});

	// Default to collapsed, delay it so it animates smoothly and shows the player
	setTimeout(toggleChatBox, TIME_CHATBOX_HIDE);

});
