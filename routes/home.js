module.exports = function(app) {

    // home page
    app.get('/', function(req, res) {        
        res.render('home/index', { title: 'Home Page.  ' })
    });

    // chat area
    app.get('/chat', function(req, res) {
        res.render('home/chat', { title: 'Chat with Me!  ' })
    });

    // about page
    app.get('/about', function(req, res) {
        res.render('home/about', { title: 'About Me.  ' })
    });    
}
