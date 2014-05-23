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
						case "search":
							if (request.data == null)
							{
								var paths = {};
								for (var key in models) {
									paths[key] = models[key].schema.paths;
								}
								var msg = {
									message: "success",
									data: paths
								};
								sendMessage(msg, request);
							} else
							{
								var model = models[request.data];
								if (model == null) return handleError("No such resource: " + request.data, request);
								if (!model.visible) return handleError("Model " + request.data + " is not public", request);
								var msg = {
									message: "success",
									data: model.schema.paths
								};
								sendMessage(msg, request);
							}
							break;
					}
				} else
				{
					// Which operation? Search, Create, Read, Update, or Delete
					var operation = request.operation;
					var Model = models[resource];
					if (Model != null)
					{
						operation = operation.toLowerCase().trim();
						switch (operation)
						{
							case "create":
								var data = request.data;
								if (data != null)
								{
									var object = new Model(data);
									object.save(function(err) {
										if (err) return handleError(err, request);
										Model.findById(object._id, function (err, doc) {
											if (err) return handleError(err, request);
											var msg = {
												message: "success",
												data: doc
											};
											sendMessage(msg, request);
										});
									});
								} else
								{
									handleError("Data field is empty", request);
								}
								break;
							case "read":
								var id = request.data;
								if (id != null)
								{
									Model.findById(id, function (err, doc) {
										if (err) return handleError(err, request);
										var msg = {
											message: "success",
											data: doc
										};
										sendMessage(msg, request);
									});
								}
								break;
							case "update":
								break;
							case "delete":
								var id = request.data;
								if (id != null)
								{
									Model.findByIdAndRemove(id, function (err, doc) {
										if (err) return handleError(err, request);
										var msg = {
											message: "success",
											data: doc
										};
										sendMessage(msg, request);
									});
								}
								break;
							case "search":
								var constraints = {};
								if (request.data != null)
									constraints = data;
								Model.find({}, function (err, objects)
								{
									if (err) return handleError(err, request);
									var msg = {
										message: "success",
										data: objects
									};
									sendMessage(msg, request);
								});
								break;
							default:
								// Turn to model specific operations
								var op = Model[operation];
								if (op != null)
								{
									op(request, session);
								}
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