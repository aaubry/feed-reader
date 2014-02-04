exports.id = "6";
exports.name = "XKCD";

exports.configure = function(builder) {
	
	return builder
		.fetchFeed("http://xkcd.com/rss.xml")
		.map(function(i) {
			var image = /src\s*=\s*["']([^"']+)/.exec(i.description);
			var image = /src\s*=\s*["']([^"']+)/.exec(i.description);
		
			return {
				title: i.title,
				guid: i.guid,
				link: i.link,
				pubDate: i.pubDate,
				body: i.description
					.replace(/["']\s*\/>/, "</p>")
					.replace(/alt\s*=\s*["']/, "/><p>")
			};
		})
		//.excludeExisting()
		.dump()
		.formatItem();
		//.selectImage();
};
