$(function() {
  var socket = io.connect();
  
  socket.on('connect', function() {
    alert('connect');
  });

  socket.on('disconnect', function() {
    alert('disconnect');
  });

  socket.on('message', function (data) {
    //$("#chat").append($("<div>" + data.mesage + "</div>"));
    alert('message')
  });	

  $("#send").click(function(e){
  	e.preventDefault();
  	var msg = $("#message").val();
  	socket.send(msg);
  	$("#chat").append($("<div><span class=\"user-me\">me:&nbsp;</span>" + msg + "</div>"));
  	$("#message").val('');
  });
})