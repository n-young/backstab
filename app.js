const express = require('express')
const app = express()
const port = 3000

app.get('/', function(req, res) {
	res.send("hello")
})

app.get('/user', function(req, res) {
	res.render("../index.html")
	//res.sendFile(path.join(__dirname+'../index.html'))
})

app.get('*', function(req, res) {
	res.send("404 not found")
})

app.listen(port, function(){
	console.log("haha yeet")
})
