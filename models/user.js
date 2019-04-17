var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose')

var UserSchema = new mongoose.Schema({
	username: String,
	name: String,
	id: Number,
	password: String,
	paid: Boolean,
	target: String,
	targetId: Number,
	due: Date,
	alive: Boolean
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
