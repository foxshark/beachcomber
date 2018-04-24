var express = require('express');
 
var app = express();
var router = express.Router();
var path = __dirname + '/views/';

app.set('views', './views');
app.set('view engine', 'jade');


app.get('/', function(req, res) {
	res.render('grid', {
		title: 'Camera Scrape'
	});  
});

app.get('/high', function(req, res) {
	res.render('sold', {
		title: 'Camera Scrape'
	});  
});

app.get('/feed/:feedid', function(req, res) {
	var feedId = req.params.feedId;
	console.log(req.params);
	res.render('grid', {
		title: 'Camera Scrape'
	});
});


app.get('/feedid', function(req, res) {
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
	  host     : '127.0.0.1',
	  user     : 'root',
	  password : '',
	  database : 'camerascrape'
	});
	 
	connection.connect();
	connection.query('SELECT * FROM feedposts WHERE feed_id = ? ORDER BY id DESC LIMIT 100', function (error, results, fields) {
		connection.end();
		if (error)  throw error;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});			
});

app.get('/grid', function(req, res) {
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
	  host     : '127.0.0.1',
	  user     : 'root',
	  password : '',
	  database : 'camerascrape'
	});
	 
	connection.connect();
	connection.query('SELECT * FROM feedposts ORDER BY id DESC LIMIT 50', function (error, results, fields) {
		connection.end();
		if (error)  throw error;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});			
});

app.get('/sold', function(req, res) {
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
	  host     : '127.0.0.1',
	  user     : 'root',
	  password : '',
	  database : 'camerascrape'
	});
	 
	connection.connect();
	connection.query('SELECT * FROM feedposts WHERE soldtime IS NOT NULL ORDER BY price DESC LIMIT 100', function (error, results, fields) {
		connection.end();
		if (error)  throw error;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});			
});

app.use(express.static(__dirname + '/public'));
 
app.listen(8087,function(){
  console.log("Live at Port 8087");
});