var pipeline = require("../bl/pipeline");

var sources = [
	{
		name: "Hacker News",
		pipeline: [
			{ fetchFeed: "https://news.ycombinator.com/rss" },
			{ fetchPages: { urlField: "link", targetField: "body" } },
			{ map: { title: "title", body: "body", guid: "comments" } },
			{ selectImage: { htmlField: "body", targetField: "imageUrl" } },
		]
	},
	{
		name: "Coding Horror",
		pipeline: [
			{ fetchFeed: "http://feeds.feedburner.com/codinghorror/" },
			{ map: { title: "title", body: "description", guid: "guid" } },
			{ selectImage: { htmlField: "body", targetField: "imageUrl" } },
		]
	},
];

exports.list = function(req, res) {
	res.render(
		"feeds/list",
		{
			title: "Raw Feeds",
			items: sources.map(function(s) { return s.name; })
		}
	);
};

exports.view = function(req, res) {
	var source = sources.filter(function(s) { return s.name == req.params.id; })[0];
	if(!source) return res.status(404).send('Not found');

	pipeline.execute(source.pipeline, pipeline_result_available);

	function pipeline_result_available(err, items) {
		if(err) return res.send(500, { error: err });

		//console.log(items);
		res.render("feeds/view", { title: source.name, items: items });
	}
};




