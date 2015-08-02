// Can't get everything to run on a single port so information is on 8081 and HTTP server is on 8080
var http = require('http'),
	express = require('express'),
	app = express();

var model = require('./models');
var models = model.models;

var loadModels = function(manifest, func)
{
	var Template = models["template"];
	var fs = require('fs');
	// I don't think this is the best way to set up the functions to create new models, but it should at least work
	var vm = require('vm');
	// Not working because fs.readFile is threaded. I need to have it work recursively.
	var loadModel = function(mod, template) {
		if (mod.schema_file != null)
		{
			var data = fs.readFileSync(__dirname + '/models/' + mod.schema_file, 'utf8').toString();
			// Compiling the schema requires actual code compilation, so require('vm') will be needed
			// Creating a new context each time should help keep each model isolated from one another
			// I need to figure out how to bind the template and the model together
			vm.runInNewContext('createModel(createSchema(' + data + '), "' + mod.name + '");', context);
		}
	};
	var mods = manifest.models;
	for (var i = 0; i < mods.length; i++) {
		var context = {
			createSchema: model.createSchema,
			createModel: model.createModel,
			console: console,
			exports: models
		};
		var mod = manifest.models[i];
		if (mod == null) return func();
		var template = null;
		if (mod.template_file != null) {
			var data = fs.readFileSync(__dirname + '/models/' + mod.template_file, 'utf8').toString();
			// Not sure how to check for errors here
			template = new Template({ html: data });
		} else if (mod.template != null) {
			template = new Template({ html: mod.template });
		}
		if (template != null) {
			template.save(function(err) {
				if (err) throw err;
				loadModel(mod, template);
			});
		} else
		{
			loadModel(mod, null);
		}
	}
};

var start = function()
{
	console.log("Loading config file...");
	var fs = require("fs");
	var config;
	fs.readFile(__dirname + '/conf/openrms.conf', 'utf8', function (err, data) {
		if (err) throw err;
		config = JSON.parse(data);
		if (config != null)
		{
			if (config.port == null) config.port = 8080;
			if (config.data_port == null) config.data_port = 8081;
			app.set('port', config.port);
			app.use(express.static(__dirname + '/../client'));
			console.log("Loading models...");
			var manifest;
			fs.readFile(__dirname + "/conf/models.manifest", "utf8", function(err, data) {
				if (err) throw err;
				manifest = JSON.parse(data);
				loadModels(manifest, function() {
					console.log("Starting server...");
					var server = require('./dataserver')(app, config.data_port, models);
					app.listen(app.get('port'));
					console.log("Server running...");
				});
			});
		}
	});
};

models['text'].find({_id : 0}, function (err, docs) {
	if (docs.length)
	{
		start();
	} else
	{
		// Configure server before starting
		console.log("Entering server configuration mode...");
		var date = new Date();
		var TextDocument = models['text'];
		var UserRole = models['user_role'];
		var Privilege = models['privilege'];
		var root = new TextDocument({links: [], content: "Welcome..."});
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
