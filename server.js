var WebSocketServer = require('ws').Server, wss = new WebSocketServer({port: 9000});

var models = require('./models');

wss.on('connection', function(ws) {
	var sendMessage = function(msg)
	{
		msg.id = new Date;
		ws.send(JSON.stringify(msg));
	};
	var handleError = function(err)
	{
			var msg = {
				request_id: request.id,
				message: "fail",
			};
			sendMessage(msg);
	};

	// Perform application authentication
	ws.onmessage = function(message)
	{
		// Left blank for now... need to implement applications first!
		// If authenticated
		ws.onmessage = function(message) {
			var request = JSON.parse(message.data);
			// Select the model
			var resource = request.resource;
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
								if (err) return handleError(err);
								Model.findById(object, function (err, doc) {
									if (err) return handleError(err);
									var msg = {
										request_id: request.id,
										message: "success",
										data: doc
									};
									sendMessage(msg);
								});
							});
						} else
						{
							sendError("Data field is empty");
						}
						break;
					case "read":
						var id = request.data;
						if (id != null)
						{
							Model.findById(id, function (err, doc) {
								if (err) return handleError(err);
								var msg = {
									request_id: request.id,
									message: "success",
									data: doc
								};
								sendMessage(msg);
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
								if (err) return handleError(err);
								var msg = {
									request_id: request.id,
									message: "success",
									data: doc
								};
								sendMessage(msg);
							});
						}
						break;
					case "search":
					default:
						Model.find(function (err, objects)
						{
							if (err) return handleError(err);
							var msg = {
								request_id: request.id,
								message: "success",
								data: objects
							};
							sendMessage(msg);
						});
						break;
				}
			} else
			{
				sendError("Resource " + resource + " is not defined.");
			}
		};
	};
});