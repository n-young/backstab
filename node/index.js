const express = require('express')
const app = express()
const port = 3000

app.get('/', function(req, res) {
	res.send("hello")
})

app.listen(port, function(){
	console.log("haha yeet")
})
