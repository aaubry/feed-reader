
var PipelineBuilder = require("../bl/PipelineBuilder").PipelineBuilder;
var pipeline = require("./pipeline");
var TaskScheduler = require("./task").TaskScheduler;

var async = require("async");

var config = require("../config/config");

exports.pollAll = function(esClient, cb) {

	var scheduler = new TaskScheduler({
		maxConcurrency: 2,
		mode: "fifo"
	}, cb);

	var feeds = config.getAllFeeds();
	feeds.forEach(function(feed) {
		scheduler.schedule(poll_feed, 1, feed.name, [esClient, feed, false]);
	});
}

exports.poll = function(esClient, feedId, testMode, cb) {
	var feed = config.getFeedById(feedId);
	poll_feed(esClient, feed, testMode, cb);
}

function poll_feed(esClient, feed, testMode, cb) {
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
			esClient: esClient,
			feedId: feed.id
		},
		cb
	);
}
