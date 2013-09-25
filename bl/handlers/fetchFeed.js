var request = require("request");
var libxmljs = require("libxmljs");

var extractors = {};

// args = { url: "http://example.com" }
exports.handler = function(item, args, context, cb) {

	try {
		request(args.url, response_available);
	} catch(err) { return cb(err); }

	function response_available(err, response, body) {
		try {
			if(err) return cb(err, null);
			if(response.statusCode != 200) return cb("HTTP status code " + response.statusCode + " received.", null);

			var mediaType = "?";
			var contentType = response.headers["content-type"];
			if(contentType) {
				mediaType = contentType.split(";")[0];
			}

			var extractor = extractors[mediaType];
			if(!extractor) return cb("No handler for media type: " + mediaType, null);

			extractor(body, cb);
		} catch(err) { return cb(err); }
	}
};

exports.handler.weight = 3;

extractors["application/rss+xml"] = function(body, cb) {
	extract_rss(libxmljs.parseXml(body), cb);
};

extractors["application/atom+xml"] = function(body, cb) {
	extract_atom(libxmljs.parseXml(body), cb);
};

extractors["text/xml"] = function(body, cb) {
	var ns = { "a": "http://www.w3.org/2005/Atom" };
	var doc = libxmljs.parseXml(body);
	if(doc.get("/rss")) {
		extract_rss(doc, cb);
	} else if(doc.get("/feed", ns)) {
                extract_atom(doc, cb);
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

function extract_atom(doc, cb) {
	var ns = { "a": "http://www.w3.org/2005/Atom" };
        var nodes = doc.find("/a:feed/a:entry", ns);

        var items = nodes.map(function(n) {

                var result = {};
                n.find("*").forEach(function(c) {
                        result[c.name()] = c.text();
                });
                return result;
        });

        cb(null, items);
}
