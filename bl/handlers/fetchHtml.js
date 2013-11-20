var request = require("request");

// args = { url: "http://example.com" }
exports.handler = function(item, args, context, cb) {
	try {
		request(args.url, response_available);
	} catch(err) { return cb(err); }

	function response_available(err, response, body) {
		try {
			if(err) return cb(err, null);
			if(response.statusCode != 200) return cb("HTTP status code " + response.statusCode + " received.", null);

			cb(null, { html: body });
		} catch(err) { return cb(err); }
	}
};

exports.handler.weight = 3;
