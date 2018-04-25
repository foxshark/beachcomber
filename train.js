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

var trainingItemQueue = [];

	 
connection.connect();
getItemSet();
getFeedSet();


function workTrainingQueue()
{
	if(trainingItemQueue.length > 0 )
	{
		//console.log("working queue of: "+trainingItemQueue.length);
		promptItemQuestion(trainingItemQueue.pop());
	} else {
		console.log("queue complete");
		connection.end();
		process.exit();
	}
}


function promptItemQuestion(item)
{
	//console.log("q: " + item.title);
	rl.question("Classify: " + item.title + " ", trainItem);
}

function trainItem(answer)
{
	console.log("a: "+answer);
	workTrainingQueue();
}


function getFeedSet()
{
	connection.query('SELECT id, title FROM feedposts WHERE feed_id = 4 ORDER BY id DESC LIMIT 5', function (error, res, fields) {
		if (error)  throw error;
		//console.log(JSON.stringify(res));
		console.table(res);
		trainingItemQueue = res;
		/*
		res.forEach(function(item) {
		  promptItemQuestion(item);
		});
		return res;
		*/
		workTrainingQueue();
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

