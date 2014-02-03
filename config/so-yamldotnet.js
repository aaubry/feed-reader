exports.id = "5";
exports.name = "StackOverflow YamlDotNet";

exports.configure = function(builder) {
	
	return builder
		.fetchFeed("http://stackoverflow.com/feeds/tag?tagnames=yamldotnet&sort=newest")
		.map(function(i) {
			return {
				title: i.title,
				guid: i.id,
				link: i.id,
				body: i.summary,
				pubDate: i.published
			};
		});
};
