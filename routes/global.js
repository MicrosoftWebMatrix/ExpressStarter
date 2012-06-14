var errorHandler = require('../middleware/errorHandler');

/**
 * Global routes.  These should be included LAST for wildcard 404 route
 * @param app {object} express application object
 **/
module.exports = function(app) {
    
    // manual 500 error
    app.get('/500', function(req, res) {
        throw new Error('This is a 500 Error');
    });  
    
    // wildcard route for 404 errors
    app.get('/*', function(req, res) {
        console.log(req.path)
        throw new errorHandler.NotFound;
    });
}