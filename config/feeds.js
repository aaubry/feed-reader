var text = require("../bl/text");

/*
Feed item format:
{
	title: string,
	body: string,
	guid: string,
	link: url,
	links: [{
		title: string,
		link: url
	}],
	pubDate: string,
	thumbUrl: url,
	imageDate: stream
}
*/

exports.categories = [
	{	id: "bd",
		name: "BD",
		feeds: [
			{	id: "smbc",
				name: "Saturday Morning Breakfast Cereals",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/smbc-comics/PvLb?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.link,
								link: i.link,
								body: i.description
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "lewis",
				name: "Lewis Trondheim Projets",
				configure: function(builder) {
					return builder
						.fetchHtml("http://lewistrondheim.com/projets")
						.xpath(
							"//h:center//h:table//h:tr[position() > 1]",
							{
								coAuthor: "h:td[2]",
								editor: "h:td[5]",
								pages: "h:td[3]",
								pubDate: "h:td[4]",
								title: "h:td[1]"
							}
						)
						.map(function(i) {
							return {
								title: i.title,
								guid: text.format("{title}-{pages}-{pubDate}", i),
								link: "http://lewistrondheim.com/projets",
								body: text.format("<ul><li>{title}</li><li>{pages}</li><li>{pubDate}</li></ul>", i),
								thumbUrl: "http://lewistrondheim.com/images/siteproj.jpg"
							};
						})
						.excludeExisting();
				}
			},
			{	id: "xkcd",
				name: "XKCD",
				configure: function(builder) {
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
						.excludeExisting()
						.selectImage();
				}
			}
		]
	},
	{	id: "interesting",
		name: "Interesting",
		feeds: [
			{	id: "mmm",
				name: "Mr Money Mustache",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/MrMoneyMustache?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								body: i["content:encoded"],
								guid: i.guid,
								link: i.origLink,
								links: [
									{ title: "Comments", link: i["wfw:commentRss"] }
								],
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "raptitude",
				name: "Raptitude",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/Raptitudecom?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								body: i["content:encoded"],
								guid: i.guid,
								link: i.origLink,
								links: [
									{ title: "Comments", link: i["wfw:commentRss"] }
								],
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "codinghorror",
				name: "Coding Horror",
				configure: function(builder) {
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
				}
			},
			{	id: "so-yamldotnet",
				name: "StackOverflow YamlDotNet",
				configure: function(builder) {
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
						})
						.excludeExisting();
				}
			}
		]
	},
	{	id: "news",
		name: "News",
		feeds: [
			{
				id: "hackernews",
				name: "Hacker News",
				configure: function(builder) {
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
				}
			}
		]
	}
];
