/**
 * error handling middleware loosely based off of the connect/errorHandler code. This handler chooses
 * to render errors using Jade / Express instead of the manual templating used by the connect middleware
 * sample.  This may or may not be a good idea :-)
 * @param options {object} array of options
 **/
exports = module.exports = function errorHandler(options) {
    options = options || {};

    // defaults
    var showStack = options.showStack || options.stack
    , showMessage = options.showMessage || options.message
    , dumpExceptions = options.dumpExceptions || options.dump
    , formatUrl = options.formatUrl;

    return function errorHandler(err, req, res, next) {
        res.statusCode = 500;
        if(dumpExceptions) console.error(err.stack);
        var app = res.app;

        if(err instanceof exports.NotFound) {
            res.render('errors/404', { locals: {
                title: '404 - Not Found'
            }, status: 404
            });
        } else {
            res.render('errors/500', { locals: {
                title: 'The Server Encountered an Error'                 
                 , error: showStack ? err : undefined
            }, status: 500
            });
        }
    };

};

exports.NotFound = function(msg) {
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}
