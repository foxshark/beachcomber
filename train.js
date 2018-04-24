// basic training proof of concept: scanners
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