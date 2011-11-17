
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , stylus = require('stylus')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(stylus.middleware({ src: __dirname + '/public'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/chat', routes.chat);


// socket.io configuration
var buffer = [];
var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket) {
  socket.emit({buffer: buffer });
  socket.broadcast.emit({announcement: socket.sessionId + ' connected'});
  socket.on('message', function (message) {
    var msg = { message: [socket.sessionId, message] };
    buffer.push(msg);
    socket.broadcast.emit(msg);
  });
  socket.on('disconnect', function() {
    socket.broadcast.emit({announcement: socket.sessionId + ' disconnected' });
  })
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

