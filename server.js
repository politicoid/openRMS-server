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

models['shop'].find({_id : 0}, function (err, docs) {
	if (docs.length)
	{
		start();
	} else
	{
		// Configure server before starting
		console.log("Entering server configuration mode...");
		var Shop = models['shop'];
		var shop = new Shop({name: "Agora Social Market", url: "socialmarket.ag", short_desc: "The world's premier online social market."});
		shop.save(function(err) {
			if (err)
			{
				console.log("Unable to save root shop: " + err);
			} else
			{
				Shop.findById(shop._id, function (err, doc) {
					if (err)
					{
						console.log("Unable to find root shop: " + err);
					} else
					{
						console.log("Added root shop: _id = " + doc._id);
						var User = models['user'];
						var salt = require('node-uuid').v4();
						var password = require('crypto').createHash('sha512').update(salt + "password").digest("hex");
						var admin = new User({username: "admin", password: password, salt: salt, shop: shop._id});
						admin.save(function(err) {
							if (err)
							{
								console.log("Unable to save admin: " + err);
							} else
							{
								User.findById(admin._id, function (err, doc) {
									if (err)
									{
										console.log("Unable to find admin: " + err);
									} else
									{
										start();
									}
								});
							}
						});
					}
				});
			}
		});
		
	}
});
