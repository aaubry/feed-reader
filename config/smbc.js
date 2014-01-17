exports.configure = function(builder) {
	
	return builder
		.fetchFeed("http://feeds.feedburner.com/smbc-comics/PvLb?format=xml")
		/*.map(function(i) {
			return {
				title: i.title,
				guid: i.link,
				link: i.link,
				body: i.description
			};
		})
		.excludeExisting()
		.selectImage("body", "imageData")*/;
}
