SELECT count(*) as c, feed_id
FROM feedposts
GROUP BY feed_id;

SELECT title, price, guid
FROM feedposts 
WHERE feed_id = 4
ORDER BY id DESC
LIMIT 40;


SELECT title, price, guid
FROM feedposts
WHERE title LIKE "%m7%"
ORDER BY price DESC
LIMIT 40;


SELECT id
FROM feedposts
WHERE feed_id = 4
AND title like "%coolscan 5000%";


SELECT training_set.item_id as item_id, feedposts.title as title FROM feedposts, training_set WHERE feedposts.id = training_set.feedpost_id;


//select to find relationships
SELECT feed_id, title, feedposts.id, keyword, sql_training.item_id
FROM feedposts, sql_training
WHERE feedposts.title like concat("%", sql_training.keyword, "%");

//populate M2M table
INSERT INTO feedposts_items 
(feedpost_id, item_id, source_feed)
SELECT feedposts.id, sql_training.item_id, feed_id
FROM feedposts, sql_training
WHERE feedposts.title like concat("%", sql_training.keyword, "%");

//populate into values table
REPLACE INTO item_values
(item_id, avg_price, quantity)
SELECT item_id, AVG(price) as avg_price, count(*) as qty
FROM feedposts, feedposts_items
WHERE feedposts.id = feedposts_items.feedpost_id
GROUP BY item_id;

SELECT feedposts.id, items.name, price, avg_price, (price - avg_price) AS price_delta, title, guid
FROM feedposts, feedposts_items, items, item_values
WHERE feedposts.id = feedposts_items.feedpost_id
AND items.id = feedposts_items.item_id
AND item_values.item_id = items.id;

//keywords
SUBSTRING_INDEX(LCASE(REPLACE(title,"-","")), "for", 1) AS keywords

//search
SELECT feedposts.id, items.brand, items.name, price, avg_price, (price - avg_price) AS price_delta, (100-ceil((price/avg_price)*100)) AS discount, title, quantity, guid
FROM feedposts, feedposts_items, items, item_values
WHERE feedposts.id = feedposts_items.feedpost_id
AND items.id = feedposts_items.item_id
AND item_values.item_id = items.id
AND items.feed_id = 1
AND quantity <= 100
AND price < 100
AND soldtime IS NULL
ORDER BY price_delta ASC;



#########  5/8/18
truncate feedposts_items;
truncate item_values;
INSERT INTO feedposts_items 
(feedpost_id, item_id, source_feed)
SELECT feedposts.id, items.id as item_id, items.feed_id
FROM feedposts, items
WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %")
AND feedposts.feed_id = items.feed_id;

#bulk mark processed
UPDATE feedposts, feedposts_items
SET feedposts.processed = 1
WHERE feedposts.id = feedposts_items.feedpost_id;


REPLACE INTO item_values
(item_id, avg_price, quantity)
SELECT item_id, AVG(price) as avg_price, count(*) as qty
FROM feedposts, feedposts_items
WHERE feedposts.id = feedposts_items.feedpost_id
GROUP BY item_id;


###
truncate unknown_gear;
INSERT INTO unknown_gear
(brand_id, feedposts_id, title, raw_title, feed_id)
SELECT brands.id AS brand_id, feedposts.id, SUBSTRING(LCASE(feedposts.title), (INSTR(LCASE(feedposts.title), LCASE(brands.name))+length(brands.name))) as raw_title, feedposts.title, feedposts.feed_id as feed_id
FROM feedposts, brands
WHERE feedposts.processed = 0
AND feedposts.title like concat("%",brands.name," %");


SELECT brands.name as brandname, SUBSTRING_INDEX(TRIM(title), " ", 1) AS word, feeds.id, feeds.name, count(1) AS qty
FROM unknown_gear, brands, feeds
WHERE unknown_gear.brand_id = brands.id
AND unknown_gear.feed_id = feeds.id
GROUP BY word
ORDER BY brandname, qty DESC
;


//attempting keyword breakdown matching
SELECT *
FROM keywords
#get keywords
WHERE ((keyword IN ("NIKKOR","70-200mm","f/2.8","II","G","SWM","AF-S","VR","IF ","ED")
AND synonym IS NULL)
#and alternates
OR id IN (
	SELECT synonym
	FROM keywords
	WHERE keyword IN ("NIKKOR","70-200mm","f/2.8","II","G","SWM","AF-S","VR","IF ","ED")
	AND synonym IS NOT NULL
))
#of the known brand or brand-less
AND ( parent = 5
OR parent IS NULL);

# select keyword based blocks based derived from direct or synonyms
SELECT *
FROM keywords
WHERE id IN (
	SELECT ref
	FROM keywords
	WHERE keyword IN ("NIKKOR","70-200mm","f/2.8","II","G","SWM","AF-S","VR","IF ","ED")
)
AND ( parent = 5
OR parent IS NULL);

# find best missed deals
SELECT *
FROM (
SELECT title, price, DATE_FORMAT(FROM_UNIXTIME(pubdatetime), '%c/%d %H:%i') as posted, DATE_FORMAT(FROM_UNIXTIME(soldtime), '%c/%d %H:%i') as ended, ABS((soldtime-pubdatetime)) AS timealive, SEC_TO_TIME(soldtime-pubdatetime) as fancytime, guid
FROM feedposts
WHERE soldtime IS NOT NULL
ORDER BY soldtime DESC
LIMIT 10000
) as subsel
WHERE timealive < 86400
AND timealive > 1
ORDER BY timealive ASC;


#find best missed deals
SELECT solditems.title, cost, time_on_market, guid
FROM solditems, feedposts
WHERE solditems.item_hash = feedposts.item_hash
AND time_on_market % 86400 != 0 #take out items that end on a 24hr mark
ORDER BY solditems.time_on_market ASC
LIMIT 200;
