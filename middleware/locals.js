

module.exports = function(req, res, next){
  var app = req.app;
  res.local('base', '/' == app.route ? '' : app.route);
  next();
};