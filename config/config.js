
/*
	feed: {
		id: string,
		name: string,
		configure: function
	}
*/

exports.config = {
	categories: [
		{
			name: "BD",
			feeds: [
				require("./smbc"),
				require("./lewis-trondheim-projets")
			]
		},
		{
			name: "Interesting",
			feeds: [
				require("./codinghorror"),
				require("./so-yamldotnet")
			]
		},
		{
			name: "Misc",
			feeds: [
				require("./hackernews")
			]
		}
	],
	
	getAllFeeds: function() {
		var feeds = [];
		this.categories.forEach(function(category) {
			feeds.push.apply(feeds, category.feeds);
		});
		return feeds;
	},
	
	getFeedById: function(id) {
		var feeds = this.getAllFeeds();
		for(var i = 0; i < feeds.length; ++i) {
			if(feeds[i].id == id) return feeds[i];
		}
		return null;
	}
}
