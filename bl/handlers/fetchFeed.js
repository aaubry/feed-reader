var request = require("request");
var libxmljs = require("libxmljs");

var extractors = {};

// args = "http://example.com"
exports.handler = function(item, url, cb) {

	//console.log("GET %s", url);
	request(url, response_available);

	function response_available(err, response, body) {
		if(err) return cb(err, null);
		if(response.statusCode != 200) return cb("HTTP status code " + response.statusCode + " received.", null);

		//console.log("GET %s => %d", url, response.statusCode);

		var mediaType = "?";
		var contentType = response.headers["content-type"];
		if(contentType) {
			mediaType = contentType.split(";")[0];
		}

		var extractor = extractors[mediaType];
		if(!extractor) return cb("No handler for media type: " + mediaType, null);

		extractor(body, cb);
	}
};

extractors["application/rss+xml"] = function(body, cb) {
	extract_rss(libxmljs.parseXml(body), cb);
};

extractors["text/xml"] = function(body, cb) {
	var doc = libxmljs.parseXml(body);
	if(doc.get("/rss")) {
		extract_rss(doc, cb);
	} else {
		cb("Could not parse xml");
	}
};

function extract_rss(doc, cb) {
	var nodes = doc.find("/rss/channel/item");

	var items = nodes.map(function(n) {

		var result = {};
		n.find("*").forEach(function(c) {
			result[c.name()] = c.text();
		});
		return result;
	});

	cb(null, items);
}


