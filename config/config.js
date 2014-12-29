
var feeds = [];
var categoriesByFeedId = {};
var categories = require("./feeds").categories;
categories.forEach(function(category) {
	categories[category.id] = category;
	category.feeds.forEach(function(feed) {
		feeds.push(feed);
		feeds[feed.id] = feed;
		category.feeds[feed.id] = feed;
		categoriesByFeedId[feed.id] = category;
	});
});

exports.getAllCategories = function() {
	return categories;
};

exports.getAllFeeds = function() {
	return feeds;
};

exports.getCategoryByFeedId = function(id) {
	var category = categoriesByFeedId[id];
	if(!category) throw new Error("Feed not found: " + id);
	return category;
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

exports.email = {
	username: "feed@aaubry.net",
	password: "wNj|u6A9OB3Jz0;8@re@",
	smtp: "mail.aaubry.net",
	imap: "mail.aaubry.net"
};
