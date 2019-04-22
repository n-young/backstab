var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose')

var UserSchema = new mongoose.Schema({
	username: String,
	name: String,
	password: String,
	id: Number,
	phone: String,
	paid: Boolean,
	target: Object,
	due: Date,
	status: String,
	elimPing: Boolean
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
