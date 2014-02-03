exports.id = "2";
exports.name = "Coding Horror";

exports.configure = function(builder) {
	
	return builder
		.fetchFeed("http://feeds.feedburner.com/codinghorror/")
		.map(function(i) {
			return {
				title: i.title,
				guid: i.guid,
				link: i.link,
				body: i.description,
				pubDate: i.pubDate
			};
		})
		.excludeExisting()
		.selectImage();
};
