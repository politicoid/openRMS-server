// Can't get everything to run on a single port so information is on 8081 and HTTP server is on 8080
var http = require('http'),
	express = require('express'),
	app = express(),
	models = require('./models');


var start = function()
{
	console.log("Starting server...");
	app.set('port', process.env.PORT || 8080);
	app.use(express.static(__dirname + '/../client'));
	var server = require('./dataserver')(app, models);
	app.listen(app.get('port'));
};

models['user'].find({_id : 0}, function (err, docs) {
	if (docs.length)
	{
		start();
	} else
	{
		// Configure server before starting
		console.log("Entering server configuration mode...");
		var date = new Date();
		var Index = models['index'];
		var UserRole = models['user_role'];
		var Privilege = models['privilege'];
		var root = new Index(_id: 0, links: []);
		root.save(function (err) {
			if (err) return console.log("Unable to create root index: " + err);
			var adminPriv = new Privilege({resources: ["*"], operations: ["*"]});
			adminPriv.save(function(err) {
				if (err) return console.log("Unable to add admin privilege " + err);
				var adminRole = new UserRole({role: "admin", privileges: [adminPriv._id]});
				adminRole.save(function(err) {
					if (err) return console.log("Unable to add admin role: " + err);
					var User = models['user'];
					var salt = require('node-uuid').v4();
					var password = require('crypto').createHash('sha512').update(salt + "password").digest("hex");
					var admin = new User({create_on: date, updated_on: date, username: "admin", password: password, salt: salt, roles: [adminRole._id]});
					admin.save(function(err) {
						if (err) return console.log("Unable to save admin: " + err);
						User.findById(admin._id, function (err, doc) {
							if (err) return console.log("Unable to find admin: " + err);
							start();
						});
					});
				});
			});
		});
	}
});
