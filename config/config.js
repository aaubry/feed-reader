
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
	var category = categories[id];
	if(!category) throw new Error("Category not found: " + id);
	return category;
};

exports.getFeedById = function(id) {
	var feed = feeds[id];
	if(!feed) throw new Error("Feed not found: " + id);
	return feed;
};
