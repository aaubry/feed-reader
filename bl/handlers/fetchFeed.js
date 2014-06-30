var http = require("../http");
var libxmljs = require("libxmljs");

var extractors = {};

exports.builder = function(url) {
	return {
		name: "Fetch RSS/ATOM feed",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				http.get(url, response_available);
			} catch(err) { return cb(err); }

			function response_available(err, response, body) {
				try {
					if(err) return cb(err, null);

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
		}
	};
};

extractors["application/rss+xml"] = function(body, cb) {
	extract_rss(libxmljs.parseXml(body), cb);
};

extractors["application/atom+xml"] = function(body, cb) {
	extract_atom(libxmljs.parseXml(body), cb);
};

extractors["text/xml"] = function(body, cb) {
	var ns = {
		"a": "http://www.w3.org/2005/Atom",
		"rss": "http://purl.org/rss/1.0/",
		"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	};
	var doc = libxmljs.parseXml(body);
	if(doc.get("/rss")) {
		extract_rss(doc, cb);
	} else if(doc.get("/a:feed", ns)) {
		extract_atom(doc, cb);
	} else if(doc.get("/rdf:RDF/rss:channel", ns)) {
		extract_rdf_rss(doc, cb);
	} else {
		cb("Could not parse xml: " + body);
	}
};

extractors["application/xml"] = extractors["text/xml"];

function xml_node_to_object(node) {
	var result = {};
	node.find("*").forEach(function(c) {
		var name = c.name();

		var ns = c.namespace();
		if(ns != null) {
			var prefix = ns.prefix();
			if(prefix != null) name = prefix + ":" + name;
		}

		result[name] = c.text();
	});
	return result;
}

function xml_nodeset_to_array(nodeset) {
	return nodes.map(xml_node_to_object);
}

function extract_rss(doc, cb) {
	var nodes = doc.find("/rss/channel/item");
	var items = nodes.map(xml_node_to_object);
	cb(null, items);
}

function extract_rdf_rss(doc, cb) {
	var ns = {
		"rss": "http://purl.org/rss/1.0/",
		"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
	};

	var nodes = doc.find("/rdf:RDF/rss:item", ns);
	var items = nodes.map(xml_node_to_object);
	cb(null, items);
}

function extract_atom(doc, cb) {
	var ns = { "a": "http://www.w3.org/2005/Atom" };
	var nodes = doc.find("/a:feed/a:entry", ns);
	var items = nodes.map(xml_node_to_object);
	cb(null, items);
}

