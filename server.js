
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
* CONFIGURATION
* -------------------------------------------------------------------------------------------------
* load configuration settings from ENV, then settings.json.  Contains keys for OAuth logins. See 
* settings.example.json.  
**/
nconf.env().file({file: 'settings.json'});


/**
* EVERYAUTH AUTHENTICATION
* -------------------------------------------------------------------------------------------------
* allows users to log in and register using OAuth
**/

everyauth.debug = true;

// Configure Facebook auth
var usersById = {},
    nextUserId = 0,
    usersByFacebookId = {},
    usersByTwitId = {},
    usersByLogin = {
        'justbe@microsoft.com': addUser({ email: 'justbe@microsoft.com', password: 'azure'})
    };

everyauth.
    everymodule.
    findUserById(function (id, callback) {
	callback(null, usersById[id]);
    });

// facebook authentication
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

// twitter authentication
everyauth
  .twitter
    .consumerKey(nconf.get('twitter:consumerKey'))
    .consumerSecret(nconf.get('twitter:consumerSecret'))
    .findOrCreateUser( function (sess, accessToken, accessSecret, twitUser) {
      return usersByTwitId[twitUser.id] || (usersByTwitId[twitUser.id] = addUser('twitter', twitUser));
    })
    .redirectPath('/');

// username / password authentication
everyauth
  .password
    .loginWith('email')
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('account/login')
    .loginLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'login.  '
        });
      }, 200);
    })
    .authenticate( function (login, password) {
      var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      var user = usersByLogin[login];
      if (!user) return ['Login failed'];
      if (user.password !== password) return ['Login failed'];
      return user;
    })
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('account/register')
    .registerLocals( function (req, res, done) {
      setTimeout( function () {
        done(null, {
          title: 'Register.  '
        });
      }, 200);
    })
    .validateRegistration( function (newUserAttrs, errors) {
      var login = newUserAttrs.login;
      if (usersByLogin[login]) errors.push('Login already taken');
      return errors;
    })
    .registerUser( function (newUserAttrs) {
      var login = newUserAttrs[this.loginKey()];
      return usersByLogin[login] = addUser(newUserAttrs);
    })
    .loginSuccessRedirect('/')
    .registerSuccessRedirect('/');

// add a user to the in memory store of users.  If you were looking to use a persistent store, this
// would be the place to start
function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { 
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
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

