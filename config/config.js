
var feeds = [];
var categories = require("./feeds").categories;
categories.forEach(function(category) {
	categories[category.id] = category;
	category.feeds.forEach(function(feed) {
		feeds.push(feed);
		feeds[feed.id] = feed;
		category.feeds[feed.id] = feed;
	});
});

exports.getAllCategories = function() {
	return categories;
};

exports.getAllFeeds = function() {
	return feeds;
};

exports.getCategoryById = function(id) {
	return categories[id];
};

exports.getFeedById = function(id) {
	return feeds[id];
};
