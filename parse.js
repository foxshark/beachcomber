var md5 = require('md5');
var Parser = require('rss-parser');
var Accounting = require('accounting');
var parser = new Parser({
	customFields: {
		//item: ['rx:BuyItNowPrice','rx:CurrentPrice','rx:EndTime','rx:BidCount','rx:Category','rx:AuctionType']
		item: [
			['rx:BuyItNowPrice','BuyItNowPrice'],
			['rx:CurrentPrice','CurrentPrice'],
			['rx:EndTime','EndTime'],
			['rx:BidCount','BidCount'],
			['rx:Category','Category'],
			['rx:AuctionType','AuctionType']
		]
	}
});
const cheerio = require('cheerio');
//buy feeds
const RSS_BIN_FILM_CAMERA = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&LH_PrefLoc=1&_sop=10&_rss=1'; //1
const RSS_BIN_LENS = 'https://www.ebay.com/sch/Lenses/3323/i.html?_from=R40&_sop=10&LH_BIN=1&LH_PrefLoc=1&_rss=1'; //2
const RSS_BIN_DIGITAL = 'https://www.ebay.com/sch/Digital-Cameras/31388/i.html?_from=R40&LH_ItemCondition=3000&_nkw=%28nikon%2C+canon%2C+leica%2C+fuji%2C+fugi%2C+sony%2C+olympus%2C+panasonic%2C+lumix%2C+camera%29&LH_PrefLoc=1&rt=nc&LH_BIN=1&_rss=1'; //3
const RSS_BIN_SCANNERS = 'https://www.ebay.com/sch/i.html?_odkw=%28coolscan%2C+reflecta%2C+pacific+image%2C+primefilm%29&LH_PrefLoc=1&_sop=10&LH_BIN=1&_oac=1&_osacat=0&_from=R40&_trksid=p2045573.m570.l1313.TR0.TRC0.H0.X%28coolscan%2C+pacific+image%2C+primefilm%29.TRS0&_nkw=%28coolscan%2C+pacific+image%2C+primefilm%29&_sacat=0&_rss=1'; //4


//sold feeds
const RSS_BIN_sold_url ='https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&LH_BIN=1&_sop=10&LH_PrefLoc=1&LH_Complete=1&LH_Sold=1&rt=nc&_trksid=p2045573.m1684&_rss=1';
const RSS_ACT_sold_url = 'https://www.ebay.com/sch/Film-Cameras/15230/i.html?_from=R40&_sop=10&LH_Complete=1&LH_Sold=1&LH_PrefLoc=1&rt=nc&LH_Auction=1&_rss=1';

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : '127.0.0.1',
  user     : 'root',
  password : '',
  database : 'camerascrape'
});
 
connection.connect();

shortFeeds();
longFeeds();

var scrapeShort = setInterval(function(){
	shortFeeds();
}, 240000); //get the feed every 4 minutes


var scrapeLong = setInterval(function(){
	longFeeds();
}, 1600000); //get the feed every hour //36 = hour


function shortFeeds()
{
	scrapeForSaleFeed(RSS_BIN_FILM_CAMERA, 1);
	scrapeForSaleFeed(RSS_BIN_LENS, 2);
}

function longFeeds()
{
	getSoldFeedBIN();
	scrapeForSaleFeed(RSS_BIN_DIGITAL, 3)
	scrapeForSaleFeed(RSS_BIN_SCANNERS, 4);
}


function scrapeForSaleFeed(feedURL, feedID)
{
	var exampleContent = "";
	parser.parseURL(feedURL, function(err, feed) {
		//console.log(feed.title);
		if (typeof feed === "undefined") {
			console.log("feed returned undefined: " + feedURL);
		} else {
			feed.items.forEach(function(entry) { 
				var storage = [];
				var $ = cheerio.load(entry.content);
				$("div").each(function() {
					storage.push($(this).text());
				});
				$("img").each(function() {
					//storage.push($(this).attr('src'));
					entry.image = $(this).attr('src');
				});
				entry.price = Accounting.unformat(storage[0]);
				storeFreshItem(entry, feedID);
			});
			var d = new Date;
			console.log(d.toLocaleTimeString() + " Fetched feed [" + feedID +"] " + feed.title + " with " + feed.items.length + " items");
		}
	});
}

function storeFreshItem(entry, feed_id) {
	var d = new Date(entry.isoDate);
	var pubd = new Date(entry.pubDate);

	var params = [
		md5(entry.guid),
		entry.content,
		entry.contentSnippet,
		entry.guid,
		entry.isoDate,
		(d.getTime() / 1000),
		entry.link,
		pubd,
		(pubd.getTime() / 1000),
		entry.title,
		entry.price,
		entry.image,
		feed_id
	];

	connection.query('INSERT IGNORE INTO feedposts (item_hash, content, content_snippet, guid, isodate, isodatetime, link, pubdate, pubdatetime, title, price, image, feed_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', params, function (error, results, fields) {
		//connection.query('INSERT INTO feedposts (content) VALUES (?) ;', params, function (error, results, fields) {
			  if (error) throw error;
			});
}


function getSoldFeedBIN() {
	var exampleContent = "";
	parser.parseURL(RSS_BIN_sold_url, function(err, feed) {
		//console.log(feed.title);
		feed.items.forEach(function(entry) { 
			var storage = [];
			var $ = cheerio.load(entry.content);
			$("div").each(function() {
				storage.push($(this).text());
			});
			$("img").each(function() {
				//storage.push($(this).attr('src'));
				entry.image = $(this).attr('src');
			});
			entry.price = Accounting.unformat(storage[0]);
			markSold(entry);
			exampleContent = JSON.stringify(entry);
		});
		//console.log(exampleContent);
		var d = new Date;
		console.log(d.toLocaleTimeString() + " SOLD Fetched feed " + feed.title + " with " + feed.items.length + " items");
	});
}

function markSold(entry) {
	var d = new Date(entry.isoDate);
	var pubd = new Date(entry.pubDate);
	var params = [
		(entry.EndTime._ / 1000),
		md5(entry.guid)
	];

	connection.query('UPDATE feedposts SET soldtime=? WHERE item_hash=?', params, function (error, results, fields) {
		//connection.query('INSERT INTO feedposts (content) VALUES (?) ;', params, function (error, results, fields) {
			  if (error) throw error;
			});
}


/*
 

content
content_snippet
guid
isodate
isodatetime
link
pubdate
pubdatetime
title
*/

/*
  var feedJSON = JSON.stringify(feed);
  var fs = require('fs');
fs.writeFile('feed_json.json', feedJSON, 'utf8');
*/







/*
content
"<table border="0" cellpadding="8"><tr><td width="80px"><a href="https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"><img border="0" src="https://i.ebayimg.com/thumbs/images/g/6zEAAOSw68lamgin/s-l225.jpg"></a></td><td><div><span><strong>$129.99</strong></span></div><div>End Date: <span>May-03 06:39</span></div><div>Buy It Now for only: US $129.99</div><a href="https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin">Buy it now</a><span> | </span><a href="http://cgi1.ebay.com/ws/eBayISAPI.dll?MfcISAPICommand=MakeTrack&item=112912395366&ssPageName=RSS:B:SHOP:US:104">Add to watch list</a></td></tr></table>"
contentSnippet
"$129.99End Date: May-03 06:39Buy It Now for only: US $129.99Buy it now | Add to watch list"
guid
"https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"
isoDate
"2018-04-03T13:39:09.000Z"
link
"https://www.ebay.com/itm/Minolta-X-700-Camera-With-Winder-G/112912395366?hash=item1a4a1a6c66:g:6zEAAOSw68lamgin"
pubDate
"Tue, 03 Apr 2018 06:39:09 GMT-07:00"
title
"Minolta ....
*/

/* schema:



*/