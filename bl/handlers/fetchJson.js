var http = require("../http");

exports.builder = function(url) {
	return {
		name: "Fetch JSON data",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				http.get(url, response_available);
			} catch(err) { return cb(err); }

			function response_available(err, response, body) {
				try {
					if(err) return cb(err, null);

					var items = JSON.parse(body);
					cb(null, items);
				} catch(err) { return cb(err); }
			}
		}
	};
};
