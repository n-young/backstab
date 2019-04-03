const express = require('express');
const ejs = require('ejs');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const bodyParser = require('body-parser');
const User = require('./models/user.js')
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const port = 3000;

mongoose.connect("mongodb://localhost/test");
app.use(express.static("public"));
app.use(require("express-session")({
	secret:"my goodness this code is very janky",
	resave: false,
	saveUninitialized: false
}));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=========================================
//ROUTES
//=========================================

app.get('/', function(req, res) {
	res.render("index.ejs");
})

app.get('/payment', function(req, res) {
	res.render("payment.ejs");
})

app.get('/grace', isLoggedIn, function(req, res) {
	res.render('grace.ejs');
})

app.get('/user', function(req, res) {
	res.render("user.ejs");
})

//REG
app.post('/register', function(req, res) {
	User.register(new User({username: req.body.username, name: req.body.name}), req.body.password, function(err, user){
		if(err) {
			console.log(err);
			return res.render('error.ejs');
		}
		passport.authenticate("local")(req, res, function() {
			res.redirect("/grace");
			console.log("2");
		})
	});
});

app.post('/login', passport.authenticate("local", {
	successRedirect: "/grace",
	failureRedirect: "/"
}), function(req, res) {
})

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/")
});

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/");
}

//ALL CATCH

app.get('*', function(req, res) {
	res.redirect('/');
})

app.listen(port, function(){
	console.log("Server listening on port: " + port);
})
