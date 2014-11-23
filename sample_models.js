
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

var Shop = createSchema(ShopSchema);
var Item = createSchema(ItemSchema);
var ItemCategory = createSchema(ItemCategorySchema);
var Price = createSchema(PriceSchema);
var Currency = createSchema(CurrencySchema);
var ItemOption = createSchema(ItemOptionSchema);
createModel(Shop, "shop");
createModel(Item, "item");
createModel(ItemOption, "item_option");
createModel(ItemCategory, "item_category");
createModel(Price, "price");
createModel(Currency, "currency");