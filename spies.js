const mongoose = require('mongoose')
mongoose.connect("mongodb://localhost/test")

var spySchema = new mongoose.Schema({
	name: String,
	email: String,
	password: String,
	target: String
});

var Spy = mongoose.model("Spy", spySchema);

var newSpy = new Spy ({
	name:"spytest2"
})

newSpy.save(function(err, spy){
	if(err){
		console.log("ha")
	} else {
		console.log("sowrk")
	}
});
