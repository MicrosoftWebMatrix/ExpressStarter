var passport = require('passport');

module.exports = function(app) {

    // user account page
    app.get('/account', ensureAuthenticated, function(req, res) {
        res.render('account/account', { user: req.user });
    });

    // login page
    app.get('/login', function(req, res) {
        res.render('account/login', { user: req.user });
    });

    // post target for login
    app.post('/login',
        passport.authenticate('local', { failureRedirect: '/login' }),
        function(req, res) {
            res.redirect('/');
        });

    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


    function ensureAuthenticated(req, res, next) {
        if(req.isAuthenticated()) { return next(); }
        res.redirect('/login')
    }





    // Redirect the user to Twitter for authentication.  When complete, Twitter
    // will redirect the user back to the application at
    // /auth/twitter/callback
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // Twitter will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/twitter/callback', 
      passport.authenticate('twitter', { successRedirect: '/',
                                         failureRedirect: '/login' }));
}

