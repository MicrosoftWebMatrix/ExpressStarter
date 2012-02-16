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
}

