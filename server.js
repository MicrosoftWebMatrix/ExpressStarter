
/**
* MODULE DEPENDENCIES
* -------------------------------------------------------------------------------------------------
* include any modules you will use through out the file
**/

var express = require('express')
  , less = require('less')
  , connect = require('connect')
  , everyauth = require('everyauth')
  , nconf = require('nconf');






/**
* OAUTH FEDERATED IDENTITY
* -------------------------------------------------------------------------------------------------
* allows users to log in and register using OAuth
**/


nconf.file({file: 'settings.json'});

everyauth.debug = true;

// Configure Facebook auth
var usersById = {},
    nextUserId = 0,
    usersByFacebookId = {},
    usersByTwitId = {};

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

everyauth
  .twitter
    .consumerKey(nconf.get('twitter:consumerKey'))
    .consumerSecret(nconf.get('twitter:consumerSecret'))
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
      return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
    })
    .redirectPath('/');


function addUser (source, sourceUser) {
    var user =  {id: ++nextUserId, source: sourceUser};
    usersById[nextUserId] = user;
    return user;
}




var app = module.exports = express.createServer();

/**
* CONFIGURATION
* -------------------------------------------------------------------------------------------------
* set up view engine (jade), css preprocessor (less), and any custom middleware (errorHandler)
**/

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('./middleware/locals'));
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'azure zomg' }));
    app.use(everyauth.middleware());
    app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
    app.use(connect.static(__dirname + '/public'));
    app.use(app.router);
});

/**
* ERROR MANAGEMENT
* -------------------------------------------------------------------------------------------------
* error management - instead of using standard express / connect error management, we are going
* to show a custom 404 / 500 error using jade and the middleware errorHandler (see ./middleware/errorHandler.js)
**/
var errorOptions = { dumpExceptions: true, showStack: true }
app.configure('development', function() { });
app.configure('production', function() {
    errorOptions = {};
});
app.use(require('./middleware/errorHandler')(errorOptions));





/**
* ROUTING
* -------------------------------------------------------------------------------------------------
* include a route file for each major area of functionality in the site
**/

require('./routes/home')(app);
require('./routes/account')(app);

// Global Routes - this should be last!
require('./routes/global')(app);







/**
* CHAT / SOCKET.IO 
* -------------------------------------------------------------------------------------------------
* this shows a basic example of using socket.io to orchestrate chat
**/

// socket.io configuration
var buffer = [];
var io = require('socket.io').listen(app);


io.configure(function() {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 100);
});

io.sockets.on('connection', function(socket) {
    socket.emit('messages', { buffer: buffer });
    socket.on('setname', function(name) {
        socket.set('name', name, function() {
            socket.broadcast.emit('announcement', { announcement: name + ' connected' });
        });
    });
    socket.on('message', function(message) {
        socket.get('name', function(err, name) {
            var msg = { message: [name, message] };
            buffer.push(msg);
            if(buffer.length > 15) buffer.shift();
            socket.broadcast.emit('message', msg);
        })
    });
    socket.on('disconnect', function() {
        socket.get('name', function(err, name) {
            socket.broadcast.emit('announcement', { announcement: name + ' disconnected' });
        })
    })
});

/**
* RUN
* -------------------------------------------------------------------------------------------------
* this starts up the server on the given port
**/

everyauth.helpExpress(app);
app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

