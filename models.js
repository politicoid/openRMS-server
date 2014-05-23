/*
 * Model definitions
 * 
 * These model definitions include various meta data descriptors
 * visible		- Model will only be listed in model search if visible is true (default)
 * internal		- Only used by the server. Should not be viewed or set by clients
 * ignore_null	- On update, if field is null, do not modify original data (name likely to change)
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
	var schema = Schema(format);
	schema.pre('save', function(next){
		this.updated_at = new Date();
		console.log(this.updated_at);
		if ( !this.created_at ) {
			this.created_at = this.updated_at;
		}
		next();
	});
	// This is so the server will only send models which are set to visible
	schema.virtual('visible').get(function() {return visible;});
	return schema;
}
function createModel(schema, name)
{
	schema.plugin(autoIncrement.plugin, name);
	exports[name] = mongoose.model(name, schema);
}

var UserSchema = {
	username		: { type: String, required: true, trim: true}
  , salt			: { type: String, required: true, trim: false, ignore_null: true, internal: true }
  , password		: { type: String, required: true, trim: false, ignore_null: true }
  , first			: { type: String, trim: true }
  , last			: { type: String, trim: true }
  , friends			: [ { type: Number, ref: "user" } ]
  , role			: [ { type: Number, ref: "user_role"}]
};

var ShopSchema = {
	name			: { type: String, required: true, trim: true }
  , stylized		: { type: String, required: true, trim: true }
  , url				: { type: String, required: true, trim: true }
  , short_desc		: { type: String, required: true, trim: true }
  , items			: [ { type: Number, ref: "items" }]
};
var ItemSchema = {
	name			: { type: String, required: true, trim: true }
  , shop			: { type: Number, required: true, ref: "shop" }	
  , sku				: { type: String, required: true, trim: true }
  , short_desc		: { type: String, required: true, trim: true }
  , long_desc		: { type: String, required: true, trim: true }
  , prices			: [{type: Number, ref: "price"}]
  , item_options	: [{type: Number, ref: "item_options"}]
  , item_categories	: [{type: Number, ref: "item_category"}]
};

var ItemCategorySchema = {
	name			: { type: String, required: true, trim: true }
  , shop			: { type: Number, required: true, ref: "shop" }	
  , items			: [ { type: Number, ref: "item" } ]
};

var PriceSchema = {
	name			: { type: String, required: true, trim: true }
  , shop			: { type: Number, required: true, ref: "shop" }	
  , value			: {type: Number, required: true}
  , currency		: {type: Number, required: true, ref: "currency"}
};

var CurrencySchema = {
	name			: { type: String, required: true, trim: true }
  , symbol			: { type: String, require: true, trim: true }
};

var User = createSchema(UserSchema);
User.statics.login = function(request, session) {
	var data = request.data;
	var username = data.username;
	var password = data.password;
	this.findOne({ 'username': username }, function (err, doc) {
		if (err)
		{
			session.handleError("Authenication failed");
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
				session.sendMessage(request);
			} else
			{
				session.handleError("Authenication failed");
			}
		}
	});
};

var Shop = createSchema(ShopSchema);
var Item = createSchema(ItemSchema);
var ItemCategory = createSchema(ItemCategorySchema);
var Price = createSchema(PriceSchema);
var Currency = createSchema(CurrencySchema);

createModel(User, "user");
createModel(Shop, "shop");
createModel(Item, "item");
createModel(ItemCategory, "item_category");
createModel(Price, "price");
createModel(Currency, "currency");

