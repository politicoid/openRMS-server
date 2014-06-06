var uuid = require('node-uuid');
	
var dataserver = function(app, models)
{
	WebSocketServer = require('ws').Server;
	var sessions = {};
	var wss = new WebSocketServer({port: 8081});
	wss.on('connection', function(ws) {
		var session = {};
		do
		{
			session.id = uuid.v4();
		} while (sessions[session.id] != null);
		sendMessage = function(msg, request)
		{
			msg['time'] = new Date();
			msg['callback_id'] = request.callback_id;
			ws.send(JSON.stringify(msg));
		};
		handleError = function(err, request)
		{
			console.log(err);
			var msg = {
				error: err
			};
			sendMessage(msg, request);
		};
		session.sendMessage = sendMessage;
		session.handleError = handleError;
		// Need to handle authentication as well at some point
		ws.onmessage = function(message) {
			var request = JSON.parse(message.data);
			// Select the model
			var resource = request.resource;
			if (resource != null)
			{
				if (resource == "model")
				{
					var operation = request.operation;
					switch (operation)
					{
						case "read":
							var model = models[request.data];
							if (model == null) return handleError("No such resource: " + request.data, request);
							if (!model.visible()) return handleError("Model " + request.data + " is not public", request);
							var msg = {
								message: "success",
								data: { paths: model.schema.paths, keys: model.keys() }
							};
							sendMessage(msg, request);
							break;
						case "search":
							var schema = {};
							for (var key in models) {
								var model = models[key];
								if (model.visible())
									schema[key] = { paths: model.schema.paths, keys: model.keys() };
							}
							var msg = {
								message: "success",
								data: schema
							};
							sendMessage(msg, request);
							break;
					}
				} else
				{
					var operation = request.operation;
					var Model = models[resource];
					if (Model != null)
					{
						operation = operation.toLowerCase().trim();
						var op = Model[operation];
						if (op != null)
						{
							var mod = models['user'];
							if (session.user)
								mod = session.user;
							mod.accessResource(resource, operation, function (err, doc) {
								console.log(doc);
								if (err) return handleError(err, request);
								op.call(Model, request, session);
							});
						} else
						{
							handleError("Resource "  + resource + " does not provide " + operation, request);
						}
					} else
					{
						handleError("Resource " + resource + " is not defined.", request);
					}
				}
			} else
			{
				handleError("No resource specified", request);
			}
		};
		ws.onclose = function()
		{
			delete session.id;
		};
	});
};

module.exports = dataserver;