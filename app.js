const express = require('express')
const app = express()
const ejs = require('ejs')
const port = 3000

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get('/', function(req, res) {
	res.render("index.ejs");
})

app.get('/user', function(req, res) {
	res.render("user.ejs");
})

app.get('/grace', function(req, res) {
	res.render('grace.ejs');
})

app.get('/payment', function(req, res) {
	res.render("payment.ejs");
})

app.get('*', function(req, res) {
	res.redirect('/');
})

app.listen(port, function(){
	console.log("Server listening on port: " + port);
})
