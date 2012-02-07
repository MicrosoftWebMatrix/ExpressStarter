module.exports = function(app) {

    var Tasks = require('../controllers/tasks'),
        azure = require('azure'),
        nconf = require('nconf');

    // home page
    // app.get('/', function(req, res) {
    //     res.render('index', { title: 'Home Page.  ' })
    // });
    
    // tasks page
    var tasks = new Tasks(
	azure.createTableService(
	    nconf.get('azure:storageAccount'), 
	    nconf.get('azure:storageAccessKey')));
    app.get('/', tasks.showItems.bind(tasks));
    app.post('/newitem', tasks.newItem.bind(tasks));
    app.post('/complete', tasks.complete.bind(tasks));

    // chat area
    app.get('/chat', function(req, res) {        
        res.render('chat', { title: 'Chat with Me!  ' })
    });

    // about page
    app.get('/about', function(req, res) {
        res.render('about', { title: 'About Me.  ' })
    });
}
