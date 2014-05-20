var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/agora');

var models = new Object();

var UserSchema = mongoose.model({
	username		: { type: String, required: true, trim: true }
  , password		: { type: String, required: true, trim: false }
  , first			: { type: String, required: true, trim: true }
  , last			: { type: String, required: true, trim: true }
  , friends			: [ { type: Schema.Types.ObjectId, ref: "user" } ]
  , created_at		: { type: Date }
  , updated_at		: { type: Date }
});

UserSchema.pre('save', function(next){
  this.updated_at = new Date;
  if ( !this.created_at ) {
    this.created_at = this.updated_at;
  }
  next();
});

exports.user = mongoose.model('user', UserSchema);