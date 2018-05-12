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
INSERT INTO feedposts_items 
(feedpost_id, item_id, source_feed)
SELECT feedposts.id, items.id as item_id, items.feed_id
FROM feedposts, items
WHERE SUBSTRING_INDEX(LCASE(REPLACE(CONCAT(" ", feedposts.title, " "),"-","")), "for", 1) like CONCAT("% ", items.name, " %")
AND feedposts.feed_id = items.feed_id;


REPLACE INTO item_values
(item_id, avg_price, quantity)
SELECT item_id, AVG(price) as avg_price, count(*) as qty
FROM feedposts, feedposts_items
WHERE feedposts.id = feedposts_items.feedpost_id
GROUP BY item_id;



