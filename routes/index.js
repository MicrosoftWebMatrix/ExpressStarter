/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Welcome to WebMatrix' })
};

exports.about = function(req, res) {
	res.render('about', { title: 'About this template' })
};

exports.chat = function(req, res) {
	res.render('chat', { title: 'Let\'s chat!' })
};