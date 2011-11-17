$(function() {

  var name = prompt('what is your name?') || 'WebMatrix User';

  var socket = io.connect();
  
  socket.on('connect', function () {
    socket.emit('setname', name);
    $("#chat").append($("<div class=\"system\">you have joined the party</div>"));
  });


  socket.on('announcement', function(data) {
    $("#chat").append($("<div class=\"system\">" + data.announcement + "</div>"));
  });

  socket.on('message', function (data) {
    $("#chat").append($("<div><span class=\"user\">" + data.message[0] + ":&nbsp;</span>" + data.message[1] + "</div>"));
  });	

  socket.on('messages', function (data) {
  	for (var i=0; i<data.buffer.length; i++) {
    	$("#chat").append($("<div><span class=\"user\">" + data.buffer[i].message[0] + ":&nbsp;</span>" + data.buffer[i].message[1] + "</div>"));
    } 
  });

  $("#send").click(function(e){
  	e.preventDefault();
  	var msg = $("#message").val();
  	socket.send(msg);
  	$("#chat").append($("<div><span class=\"user-me\">me:&nbsp;</span>" + msg + "</div>"));
  	$("#message").val('');
  });

})