/*
 * Model definitions
 * 
 * These model definitions include various meta data descriptors
 * name				- Stylized column name
 * visible			- Model will only be listed in model search if visible is true (default)
 * ignore_null		- On update, if field is null, do not modify original data (name likely to change)
 * internal			- Only used by the server. Should not be viewed or set by clients (automatically sets ignore_null)
 * parent			- Parent object (automatically embeds ref option)
 * media_type		- Media types as listed in official registry of media types: http://www.iana.org/assignments/media-types/media-types.xhtml
 * 
 * Keys:
 * human_readable	- This key is human readable
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	autoIncrement = require('mongoose-auto-increment'),
	crypto = require('crypto');

var connection = mongoose.connect('mongodb://localhost/agora');
autoIncrement.initialize(connection);

if (typeof JSON.clone !== "function")
{
    JSON.clone = function(obj)
    {
        return JSON.parse(JSON.stringify(obj));
    };
}

// TextDocument is used in the createSchema function, so it needs to be defined beforehand
var TextDocumentSchema = {
	content: {type: String, required: true},
	mime_type: "text"
};

schema.plugin(autoIncrement.plugin, "text");
var TextDocument = mongoose.model("text", TextDocumentSchema);


// Take a schema definition and add in framework components 
function createSchema(format, visible)
{
	if (visible == null)
		visible = true;
	format.created_on = {type: Date, internal: true};
	format.updated_on = {type: Date, internal: true};
	format.links = [ { name: String, text: String, foreign: Boolean, model: String, location: String} ];
	format.index = {type: Number, ref: "index"}
	var internals = [];
	var ignores = [];
	var keys = {};
	for (var key in format)
	{
		var field = format[key];
		if (key == 'keys')
		{
			keys = field;
			delete format[key];
		} else
		{
			if (field[0] != null)
				field = field[0];
			if (field.name == null)
				field.name = key;
			if (field.parent != null)
				field.ref = field.parent;
			if (field.internal)
			{
				if (field.ignore_null == null)
					field.ignore_null = true;
				internals.push(key);
			}
			if (field.ignore_null)
				ignores.push(key);
		}
	}
	// Default human_readable key to the id
	if (keys.human_readable == null)
		keys.human_readable = '_id';
	
	var schema = Schema(format);
	// This is so the server will only send models which are set to visible
	schema.statics.visible = function() { return visible; };
	schema.statics.keys = function() { return keys; };
	
	// Prevent internal information from being sent to the client
	schema.methods.toJSON = function() {
		var obj = this.toObject();
		for (var i = 0; i < internals.length; i++)
		{
			delete obj[internals[i]];
		}
		return obj;
	};
	// Creates a new document. Returns an error if the document already exists
	schema.statics.create = function(request, session)
	{
		var that = this;
		var data = request.data;
		if (data != null)
		{
			var doc = data.doc;
			doc.updated_on = new Date();
			doc.created_on = data.updated_on;
			// Eventually replace with a function so it's possible to create dynamics FS
			var object = new that(doc);
			var url = data.url;
			var saveObject = function(parent) {
				object.save(function(err) {
					if (err) return session.handleError(err, request);
					that.findById(object._id, function (err, doc) {
						if (err) return session.handleError(err, request);
						if (parent != null)
						{
							// Problem with this method of error handling is the document was saved, just not added to parent. But this type of error shouldn't happen.
							parent.index.push({name: hyperlink.name, text: hyperlink.text, object._id});
							parent.save(function(err) {
								return session.handleError(err, request);
							}
						}
						var msg = {
							message: "success",
							data: doc
						};
						session.sendMessage(msg, request);
					});
				});
			};
			if (url != null)
			{
				if (url.parentID != null)
				{
					// Get the correct model
					var model = exports[url.model];
					if (model == null) return session.handleError("Unknown model type of parent", request);
					model.findById(url.parentID, function(err, parent) {
						saveObject(parent);
					});
				} else
				{
					session.handleError("Unable to find parent", requet);
				}
			} else
			{
				// Save without any parent - Might not use this option
			}
		} else
		{
			session.handleError("Data field is empty", request);
		}
	};
	schema.statics.update = function(request, session)
	{
		var that = this;
		var doc = request.data;
		if (doc == null) return session.handleError("No data specified", request);
		var id = doc._id;
		if (id == null) return session.handleError("No ID specified. Use create for new documents.");
		that.findById(id, function(err, old) {
			if (err != null) return session.handleError(err, request);
			for (var key in doc)
			{
				var val = doc[key];
				if (val == null)
				{
					if (ignores[key] == null)
						old[key] = null;
				} else
				{
					old[key] = doc[key];
				}
			}
			old.save(function (err) {
				if (err) return session.handleError(err, request);
				var msg = {
					message: "success",
					data: doc
				};
				session.sendMessage(msg, request);
			});
		});
	};
	schema.statics.search = function(request, session) {
		var data = request.data;
		var constraints = {};
		if (data != null)
		{
			if (data.constraints != null)
			{
				constraints = data.constraints;
				var populate = data.populate;
				var query = this.find(constraints);
				if (populate != null)
					query = query.populate(populate);
				query.exec(function (err, docs) {
					if (err) return handleError(err, request);
					var msg = {
						message: "success",
						data: docs
					};
					sendMessage(msg, request);
				});
			}
		}
	};
	// Remove does not yet remove dead links from parents
	schema.statics.remove = function(request, session) {
		var data = request.data;
		var id = null;
		if (data != null)
			id = data.id;
		if (id != null)
		{
			this.findByIdAndRemove(id, function (err, doc) {
				if (err) return session.handleError(err, request);
				var msg = {
					message: "success",
					data: doc
				};
				session.sendMessage(msg, session.request);
			});
		}
	};
	schema.statics.read = function(request, session) {
		var data = request.data;
		if (data != null)
		{
			var id = data.id;
			var populate = data.populate;
			if (id != null)
			{
				var query = this.findById(id);
				if (populate != null)
					query = query.populate(populate);
				query.exec(function (err, doc) {
					if (err) return handleError(err, request);
					var msg = {
						message: "success",
						data: doc
					};
					sendMessage(msg, request);
				});
			} else if (data.url != null)
			{
				// Access resource by virtual filesystem location
				var that = this;
				var url = data.url;
				TextDocument.findById(0, function (err, doc) {
					if (err) return session.handleError(err, request);
					// Remove leading and **trailing** backslashes
					if url.startsWith("/")
						url = url.substring(1);
					var list = url.split("/");
					if (list.length > 0 && url != "")
					{	
						int i = 0;
						// Parse the hyperlink until the end or until resource not found
						var parse = function()
						{
							var link = doc.index[list[i]];
							if (i < list.length && link != null)
							{
								// Check if the resource is foreign
								if (link.foreign == true)
								{
									var url = link.url;
									// Append remaining section of the hyperlink to the url
									var sublist = list.slice(i+1, list.length - 1);
									if (!url.endsWith("/"))
										url = url + "/";
									url = url + sublist.join("/");
									// Tell the client that the resource is foreign
									var msg = {
										message: "foreign",
										data: url
									};
								} else
								{
									var model = exports[link.model];
									if (model == null) return session.handleError("Unknown model", request);
									model.findById(Number(link.location), function (err, doc) {
										if (err) return session.handleError(err, request);									doc = link.doc;
										i = i + 1;
										parse();
									});
								}
							} else if (link == null)
							{
								session.handleError("resource not found", request);
							} else
							{
								var msg = {
									message: "success",
									data: doc
								};
								sendMessage(msg, request);
							};
						}
					} else
					{
						var msg = {
							message: "success",
							data: doc
						};
						sendMessage(msg, request);
					}
				});
			}
		}
	};
	return schema;
}

// Take finalized schema and create a model, adding it to the list of models available to the server
function createModel(schema, name)
{
	schema.plugin(autoIncrement.plugin, name);
	exports[name] = mongoose.model(name, schema);
}

// Built in models

var UserSchema = {
	username		: { type: String, required: true, trim: true }
  , salt			: { type: String, required: true, trim: false, internal: true }
  , password		: { type: String, required: true, trim: false, ignore_null: true }
  , first			: { type: String, trim: true }
  , last			: { type: String, trim: true }
  , friends			: [ { type: Number, ref: "user" } ]
  , roles			: [ { type: Number, ref: "user_role"}]
  , keys			: { human_readable: 'username' }
};

var UserRoleSchema = {
	role			: { type: String, required: true, trim: true }
  , users			: [ { type: Number, parent: "user" } ]
  , privileges		: [ { type: Number, required: true, ref: "privilege" } ]
  , keys			: { human_readable: 'role' }
};

var PrivilegeSchema = {
	resources		: [ { type: String, required: true, trim: true } ]
  , operations		: [ { type: String, required: true, trim: true } ]
  , user_role		: { type: String, parent: "user_role" }
};

var AuthorizationSchema = {
	
};

var StreamSchema = {
	
};

var User = createSchema(UserSchema);
User.statics.login = function(request, session) {
	var data = request.data;
	var username = data.username;
	var password = data.password;
	this.findOne({ 'username': username }, function (err, doc) {
		if (err)
		{
			session.handleError(err, request);
		} else
		{
			var sha512 = crypto.createHash('sha512').update(doc.salt + password).digest("hex");
			if (sha512 == doc.password)
			{
				session.user = doc;
				var msg = {
					message: "success",
					data: session.id
				};
				session.sendMessage(msg, request);
			} else
			{
				session.handleError("Authenication failed", request);
			}
		}
	});
};

User.methods.accessResource = function(resource, operation, func) {
	var roles = this.roles;
	var find = this.model('user_role').find({'role' : {$in : roles}});
	var pop = find.populate({path: 'privileges', match: {resources: {$in : ['*', resource]}, operations: {$in: ['*', operation]}}});
	pop.exec(func);
};
// Access control shared for all users. This is mainly used when not logged in. Some of this will be defined in the schema
User.statics.accessResource = function(resource, operation, func) {
	// Make sure all users can log in
	if (resource == "user" && operation == "login")
		func(null, this);
//	var find = this.model('user_role').find({'role' : {$in : roles}});
//	var pop = find.populate({path: 'privileges', match: {resources: {$in : ['*', resource]}, operations: {$in: ['*', operation]}}});
};

var UserRole = createSchema(UserRoleSchema);
var Privilege = createSchema(PrivilegeSchema);

createModel(User, "user");
createModel(Privilege, "privilege");
createModel(UserRole, "user_role");

var TextDocument = createSchema(TextDocumentSchema);
createModel(TextDocument, "text");

/* TODO
 * Importing custom models
 * -----------------------
 * There are two options:
 * 1. Import files
 * 2. Some kind of model management service similar to DNS
 *
 * Rendering Templates
 * -------------------
 * Easiest method is to use Polymer 1.0, but then I'm relying on a system which could easily change
*/
