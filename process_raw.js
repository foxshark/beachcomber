// basic training proof of concept: scanners
const console = require('better-console');
const readline = require('readline');
const mysql      = require('mysql');
const md5 = require('md5');
const natural = require('natural');

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

exports.processItemSet = function()
{
	fixURL();
	console.log("start raw processing");
	connection.query('SELECT feedposts_raw.content FROM feedposts_raw LEFT JOIN solditems ON feedposts_raw.item_hash = solditems.item_hash WHERE solditems.item_hash IS NULL LIMIT 1000', function (error, res, fields) {
		if (error)  throw error;
		//console.table(res);
		//console.log(JSON.stringify(res));
		if(res) {
			console.log(res.length + " raw records found.")
			res.forEach(function(itemData) {
				//console.table(JSON.parse(item.content));
				var item = JSON.parse(itemData.content);
				try {
					recordTransaction(item);
				} catch(err) {
					console.log(item.tile + " was malformatted");
				}
			});
		} else {
			console.log("could not connect to DB");
			// process.exit;
		}
	});
}

function recordTransaction(item)
{
	var itemId = item.link.split("?").shift().split("/").pop();
	var startTime = Date.parse(item.isoDate)/1000;
	var endTime = (item.EndTime._/1000);

	var params = [
			md5(item.guid),
			itemId,
		 	item.title,
		 	(item.CurrentPrice._/100),
		 	(endTime - startTime),
		 	endTime,
		 	item.guid,
	 	];

	connection.query('INSERT IGNORE INTO solditems (item_hash, item_id, title, cost, time_on_market, sold_date, item_url) VALUES (?,?,?,?,?,?,?);',
		params, 
		function (error, res, fields) {
			if (error)  throw error;
			//console.log(item.title);
		});
}

function fixURL()
{
	connection.query('SELECT feedposts_raw.content, solditems.id FROM feedposts_raw, solditems WHERE feedposts_raw.item_hash = solditems.item_hash AND solditems.item_url IS NULL LIMIT 5000', function (error, res, fields) {
		if (error)  throw error;
		//console.table(res);
		//console.log(JSON.stringify(res));
		if(res && res.length > 0) {
			console.log(res.length + " missing URL records found.")
			res.forEach(function(itemData) {
				var item = JSON.parse(itemData.content);
				var params = [item.guid, itemData.id];
				//console.log(params);
				connection.query('UPDATE solditems SET item_url = ? WHERE id = ?', params, function (error2, res, fields) {
					if (error2)  {
						throw error2;
					}
				});	
			});
		}
	});				
}
