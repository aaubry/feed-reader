var crud = require("./crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

var pipeline = require("./pipeline");
var TaskScheduler = require("./task").TaskScheduler;

var crypto = require("crypto");
var async = require("async");
var fs = require("fs");

var handlers = {};

["fetchFeed", "fetchPages", "map", "selectImage", "excludeExisting", "fetchHtml"].forEach(function(n) {
	handlers[n] = require("./handlers/" + n).handler;
	if(handlers[n] == null) {
		throw "Badly defined pipeline handler '" + n + "'";
	}
});

exports.pollAll = function(dbFactory, cb) {

	var scheduler = new TaskScheduler({
		maxConcurrency: 2,
		mode: "fifo"
	}, cb);

	var feeds = crud.create(dbFactory, "Feeds");
	feeds.getAll({}, null, feeds_retrieved);

	function feeds_retrieved(err, feeds) {
		if(err) return cb(err);
		
		feeds.items.forEach(function(feed) {
			scheduler.schedule(poll_feed, 1, feed.name, dbFactory, feed, false);
		});
	}
}

exports.poll = function(dbFactory, feedId, testMode, cb) {
	var feeds = crud.create(dbFactory, "Feeds");

	if(typeof(feedId) == "string") feedId = ObjectID.createFromHexString(feedId);
	feeds.getOne(feedId, feed_retrieved);

	function feed_retrieved(err, feed) {
		if(err) return cb(err);
		if(feed.item == null) return cb("Not found");
		
		poll_feed(dbFactory, feed.item, testMode, cb);
	}
}

function poll_feed(dbFactory, feed, testMode, cb) {
	var feedItems = crud.create(dbFactory, "Items");

	var finalSteps = testMode
		? [print_item]
		: [format_item, save_thumbnail, store_item];
	
	pipeline.execute(
		feed.pipeline.concat(finalSteps),
		{ db: feedItems },
		handlers,
		cb
	);

	function format_item(item, data, context, cb) {
		try  {
			var pubDate	= new Date(item.pubDate);
			if(!(pubDate.valueOf() > 0)) pubDate = new Date();

			var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
			var feedItem = {
				_id: itemId,
				feedId: feed._id,

				title: item.title,
				body: item.body,
				guid: item.guid,
				link: item.link,
				pubDate: pubDate,
				imageData: item.imageData
			};
			cb(null, feedItem);
		} catch(err) { cb(err); }
	}

	function save_thumbnail(item, data, context, cb) {
		try {
			if(item.imageData != null) {
				item.thumbUrl = "/thumbs/" + item._id + ".png";
				
				var destinationFile = "public" + item.thumbUrl;
				var stream = fs.createWriteStream(destinationFile);
				stream.end(item.imageData, null, image_written);
				
				function image_written(err) {
					delete item.imageData;
					cb(err, item);
				}
			} else {
				cb(null, item);
			}
		} catch(err) { cb(err); }
	}

	function store_item(item, data, context, cb) {
		try {
			feedItems.insert(item, item_stored);
		} catch(err) { cb(err); }

		function item_stored(err) {
			cb(err == null || err.code == 11000 ? null : err);
		}
	}
	
	function print_item(item, data, context, cb) {
		console.log(item);
		cb(null);
	}
}
