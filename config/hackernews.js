exports.id = "3";
exports.name = "Hacker News";

exports.configure = function(builder) {
	
	return builder
		.fetchFeed("https://news.ycombinator.com/rss")
		.map(function(i) {
			return {
				title: i.title,
				guid: i.comments,
				link: i.link,
				links: [
					{ title: "Comments", link: i.comments }
				]
			};
		})
		.excludeExisting()
		.fetchPages()
		.selectImage();
};
