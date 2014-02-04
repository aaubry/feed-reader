var text = require("../bl/text");

exports.id = "1";
exports.name = "Lewis Trondheim Projets";

exports.configure = function(builder) {
	
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
};
