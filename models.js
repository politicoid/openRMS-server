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

function createSchema(format, visible)
{
	if (visible == null)
		visible = true;
	format.created_on = {type: Date, internal: true};
	format.updated_on = {type: Date, internal: true};
	var internals = [];
	var ignores = [];
	var keys = null;
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
			data.updated_at = new Date();
			data.created_at = data.updated_at;
			var object = new that(data);
			object.save(function(err) {
				if (err) return session.handleError(err, request);
				that.findById(object._id, function (err, doc) {
					if (err) return session.handleError(err, request);
					var msg = {
						message: "success",
						data: doc
					};
					session.sendMessage(msg, request);
				});
			});
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
		var id = null;
		if (data != null)
		{
			id = data.id;
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
			}
		}
	};
	return schema;
}
function createModel(schema, name)
{
	schema.plugin(autoIncrement.plugin, name);
	exports[name] = mongoose.model(name, schema);
}

var UserSchema = {
	username		: { type: String, required: true, trim: true }
  , salt			: { type: String, required: true, trim: false, internal: true }
  , password		: { type: String, required: true, trim: false, ignore_null: true }
  , first			: { type: String, trim: true }
  , last			: { type: String, trim: true }
  , friends			: [ { type: Number, ref: "user" } ]
  , role			: [ { type: Number, ref: "user_role"}]
  , keys			: { human_readable: 'username' }
};

var ShopSchema = {
	name			: { type: String, required: true, trim: true }
  , url				: { type: String, required: true, trim: true }
  , short_desc		: { type: String, required: true, trim: true }
  , items			: [ { type: Number, ref: "item", ignore_null: true }]
  , keys			: { human_readable: 'name' }
};
var ItemSchema = {
	name			: { type: String, required: true, trim: true }
  , shop			: { type: Number, required: true, parent: "shop" }	
  , sku				: { type: String, required: true, trim: true }
  , short_desc		: { type: String, required: true, trim: true }
  , long_desc		: { type: String, required: true, trim: true, name: 'Description', media_type: 'text/html' }
  , prices			: [{type: Number, ref: "price"}]
  , item_options	: [{type: Number, ref: "item_option"}]
  , item_categories	: [{type: Number, parent: "item_category"}]
  , keys			: { human_readable: 'name' }
};

var ItemOptionSchema = {
	name			: { type: String, required: true, trim: true }
  , item			: { type: Number, parent: "item" }
  , option			: { type: Number, ref: "item" }
  , keys			: { human_readable: 'name' }
};

var ItemCategorySchema = {
	name			: { type: String, required: true, trim: true },
	parent			: { type: Number, ref: "item_category"}
  , shop			: { type: Number, required: true, parent: "shop" }	
  , items			: [ { type: Number, ref: "item" } ]
  , keys			: { human_readable: 'name' }
};

var PriceSchema = {
	name			: { type: String, required: true, trim: true }
  , shop			: { type: Number, required: true, ref: "shop" }	
  , value			: {type: Number, required: true}
  , currency		: {type: Number, required: true, ref: "currency"}
  , keys			: { human_readable: 'name' }
};

var CurrencySchema = {
	name			: { type: String, required: true, trim: true }
  , symbol			: { type: String, require: true, trim: true }
  , keys			: { human_readable: 'name' }
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
var Shop = createSchema(ShopSchema);
var Item = createSchema(ItemSchema);
var ItemCategory = createSchema(ItemCategorySchema);
var Price = createSchema(PriceSchema);
var Currency = createSchema(CurrencySchema);
var ItemOption = createSchema(ItemOptionSchema);

createModel(User, "user");
createModel(Shop, "shop");
createModel(Item, "item");
createModel(ItemOption, "item_option");
createModel(ItemCategory, "item_category");
createModel(Price, "price");
createModel(Currency, "currency");