
module.exports = function(app) {

    // user account page
    app.get('/account', function(req, res) {
        res.render('account/account', { user: req.user });
    });

    // login page
    app.get('/login', function(req, res) {
        res.render('account/login', { user: req.user });
    });

    // logout
    app.get('/logout', function(req, res) {
        res.redirect('/');
    });
}

