
/*
	feed: {
		id: string,
		name: string,
		configure: function
	}
*/

exports.config = {
	categories: require("./feeds").categories,
	
	getAllFeeds: function() {
		var feeds = [];
		this.categories.forEach(function(category) {
			feeds.push.apply(feeds, category.feeds);
		});
		return feeds;
	},
	
	getCategoryById: function(id) {
		var categories = this.categories;
		for(var i = 0; i < categories.length; ++i) {
			if(categories[i].id == id) return categories[i];
		}
		return null;
	},
	
	getFeedById: function(id) {
		var feeds = this.getAllFeeds();
		for(var i = 0; i < feeds.length; ++i) {
			if(feeds[i].id == id) return feeds[i];
		}
		return null;
	}
}
