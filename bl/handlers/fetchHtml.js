var request = require("request");

exports.builder = function(url) {
	return {
		name: "Fetch HTML page",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				request(url, response_available);
			} catch(err) { return cb(err); }

			function response_available(err, response, body) {
				try {
					if(err) return cb(err, null);
					if(response.statusCode != 200) return cb("HTTP status code " + response.statusCode + " received.", null);

					cb(null, { html: body });
				} catch(err) { return cb(err); }
			}
		}
	};
};
