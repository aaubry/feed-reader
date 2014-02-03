var crud = require("./crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

var PipelineBuilder = require("../bl/PipelineBuilder").PipelineBuilder;
var pipeline = require("./pipeline");
var TaskScheduler = require("./task").TaskScheduler;

var async = require("async");

var config = require("../config/config").config;

exports.pollAll = function(dbFactory, cb) {

	var scheduler = new TaskScheduler({
		maxConcurrency: 2,
		mode: "fifo"
	}, cb);

	var feeds = config.getAllFeeds();
	feeds.forEach(function(feed) {
		scheduler.schedule(poll_feed, 1, feed.name, [dbFactory, feed, false]);
	});
}

exports.poll = function(dbFactory, feedId, testMode, cb) {
	var feed = config.getFeedById(feedId);
	poll_feed(dbFactory, feed, testMode, cb);
}

function poll_feed(dbFactory, feed, testMode, cb) {
	var feedItems = crud.create(dbFactory, "Items");
	
	var builder = new PipelineBuilder();
	feed.configure(builder);
	
	if(testMode) {
		builder.dump();
	} else {
		builder
			.formatItem()
			.saveThumbnail()
			.storeItem();
	}

	pipeline.execute(
		builder.build(),
		{
			db: feedItems,
			feedId: feed.id
		},
		cb
	);
}
