// connect to our socket server
var socket = io.connect(window.location.href);

var app = app || {};

// On document.ready
$(function()
{
	// Element references
	var $inputField = $('#input'),
		$messages = $('#messages'),
		$sendButton = $('#send');

	// SocketIO setup
	socket.on("message", function(data)
	{
		var copy = $messages.html();
		$messages.html('<p>' + copy + data.msg + "</p>");
		$messages.scrollTop($messages[0].scrollHeight - $messages.height());
	});
	
	$sendButton.click(function(e)
	{
		var message = $inputField.val();
		if (message.length){
			socket.emit("message", { 
				msg: message 
			}, function(data){
				$inputField.val('');
			});
		}
	});

	$inputField.keydown(function (e){
	    if(e.keyCode == 13){
	        $sendButton.trigger('click');
	    }
	})
	
});
