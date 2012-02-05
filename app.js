
/**
 * Module dependencies.
 */

var express = require('express')
    less = require('less'),
    everyauth = require('everyauth'),
    nconf = require('nconf');

var app = module.exports = express.createServer();

nconf.file({file: 'settings.json'});

everyauth.debug = true;

// Configure Facebook auth
var usersById = {},
    nextUserId = 0,
    usersByFacebookId = {};

everyauth.
    everymodule.
    findUserById(function (id, callback) {
	callback(null, usersById[id]);
    });

everyauth.
    facebook.
    appId(nconf.get('facebook:applicationId')).
    appSecret(nconf.get('facebook:applicationSecret')).
    findOrCreateUser(
	function(session, accessToken, accessTokenExtra, fbUserMetadata){
	    return usersByFacebookId[fbUserMetadata.claimedIdentifier] || 
		(usersByFacebookId[fbUserMetadata.claimedIdentifier] = 
		 addUser('facebook', fbUserMetadata));
	}).
    redirectPath('/');

function addUser (source, sourceUser) {
    var user =  {id: ++nextUserId, source: sourceUser};
    usersById[nextUserId] = user;
    return user;
}
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views'); 
  app.set('view engine', 'jade');  
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'azure zomg'}));
  app.use(require('./middleware/locals'));
  app.use(express.compiler({ src: __dirname + '/public', enable: ['less']}));
  app.use(everyauth.middleware());
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
require('./routes/home')(app);


// socket.io configuration
var buffer = [];
var io = require('socket.io').listen(app);


io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 100); 
});

io.sockets.on('connection', function (socket) {
  socket.emit('messages', { buffer: buffer });
  socket.on('setname', function(name) {
    socket.set('name', name, function() {
      socket.broadcast.emit('announcement', {announcement: name + ' connected'});
    });
  });
  socket.on('message', function (message) {
    socket.get('name', function(err, name){
      var msg = { message: [name, message] };
      buffer.push(msg);
      if (buffer.length > 15) buffer.shift();
      socket.broadcast.emit('message', msg);
    })
  });
  socket.on('disconnect', function() {
    socket.get('name', function(err, name) {
      socket.broadcast.emit('announcement', {announcement: name + ' disconnected' });
    })
  })
});

everyauth.helpExpress(app);

app.listen(process.env.PORT || 3000);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

