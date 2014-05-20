var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({port: 8080});

var models = require('./models');

var processMessages = function(message) {
	var request = JSON.parse(message.data);
	// Select the model
	var resource = request.resource;
	// Which operation? Search, Create, Read, Update, or Delete
	var operation = request.operation;
	var model = models[resource];
	if (model != null)
	{
		operation = operation.toLowerCase().trim();
		switch (operation)
		{
			case "create":
				break;
			case "update":
				break;
			case "delete":
				break;
			case "search":
			default:
				break;
		}
	} else
	{
		// No such model
	}
};

wss.on('connection', function(ws) {
	// Perform application authentication
	ws.onmessage = function(message)
	{
		// Left blank for now... need to implement applications first!
		// If authenticated
		ws.onmessage = processMessages(message);
	};
});