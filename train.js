// basic training proof of concept: scanners
const console = require('better-console');
const readline = require('readline');
const mysql      = require('mysql');
const natural = require('natural');

const classifier = new natural.BayesClassifier();
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
trainFromDB();
//getItemSet();
//getFeedSet();


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
	rl.question("Classify: " + item.title + " ", (answer)=> trainItem(item.id, answer));
}

function trainItem(feedpost_id, answer = "")
{
	if(answer != "") {
		storeTrain(feedpost_id, answer);
	} else {
		console.log("Skipped");
	}
	workTrainingQueue();
}


function storeTrain(feedpost_id, item_id)
{
	connection.query('INSERT INTO training_set (feedpost_id, item_id) VALUES (?, ?);',
		[feedpost_id, item_id],
		function (error, res, fields) {
			if (error)  throw error;
		});		
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


function trainFromDB()
{
	connection.query('SELECT training_set.item_id as item_id, feedposts.title as title FROM feedposts, training_set WHERE feedposts.id = training_set.feedpost_id', function (error, res, fields) {
		if (error)  throw error;
		//console.table(res);
		
		res.forEach(function(item) {
		  classifier.addDocument(item.title, item.item_id);
		});

		classifier.train();
		//console.log(JSON.stringify(classifier));
		console.table(classifier.getClassifications('coolscan v'));


	});			



}
