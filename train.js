// basic training proof of concept: scanners
const console = require('better-console');
const readline = require('readline');
const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'camerascrape'
});
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

	 
connection.connect();
getItemSet();
getFeedSet();



function promptItemQuestion(item)
{
	rl.question("Classify: " + item.title, trainItem + " ");
}

function trainItem(answer)
{
	console.log("a: "+answer);
}


function getFeedSet()
{
	connection.query('SELECT id, title FROM feedposts WHERE feed_id = 4 ORDER BY id DESC LIMIT 5', function (error, res, fields) {
		if (error)  throw error;
		//console.log(JSON.stringify(res));
		console.table(res);
		res.forEach(function(item) {
		  promptItemQuestion(item);
		});
		return res;
	});				
}

function getItemSet()
{
	connection.query('SELECT id, name FROM items', function (error, res, fields) {
		if (error)  throw error;
		//console.log(JSON.stringify(res));
		console.table(res);
	});				
}

