var http = require("../http");

exports.builder = function(url, append, encoding) {
	return {
		name: "Fetch JSON data",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				if(typeof url === "function") {
					url = url(item);
				}

				http.get(url, { Accept: "application/json" }, encoding, response_available);
			} catch(err) { return cb(err); }

			function response_available(err, response, body) {
				try {
					if(err) return cb(err, null);

					var items = JSON.parse(body);
					
					if(append) {
						if(item == null) {
							item = { results: [] };
						}
						
						item.results.push(items);
						items = item;
					}
					
					cb(null, items);
				} catch(err) { return cb(err); }
			}
		}
	};
};
