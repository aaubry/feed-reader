var request = require("request");
var zlib = require("zlib");

exports.get = function(url, cb) {
	try {
		var options = { url: url };
		var req = request(options);
		
		req.on("response", function(response) {
			var chunks = [];
			
			response.on("data", function(chunk) {
				chunks.push(chunk);
			});
			
			response.on("end", function() {
				var buffer = Buffer.concat(chunks);
					
				var encoding = response.headers["content-encoding"];
				if (encoding == "gzip") {
					zlib.gunzip(buffer, function(err, decoded) {
						cb(err, response, decoded && decoded.toString());
					});
				} else if (encoding == "deflate") {
					zlib.inflate(buffer, function(err, decoded) {
						cb(err, response, decoded && decoded.toString());
					})
				} else {
					cb(null, response, buffer.toString());
				}
			 });
		});

		req.on("error", cb);
	} catch(err) { return cb(err); }

	function response_available(err, response, body) {
		try {
			if(err) return cb(err, null);
			if(response.statusCode != 200) return cb("HTTP status code " + response.statusCode + " received.", null);

			console.log(typeof body);
			
			var encoding = response.headers['content-encoding'];
			if (encoding == 'gzip') {
				zlib.gunzip(body, function(err, decoded) {
					cb(err, response, decoded);
				});
			} else if (encoding == 'deflate') {
				zlib.inflate(body, function(err, decoded) {
					cb(err, response, decoded);
				})
			} else {
				cb(err, response, body);
			}
		} catch(err) { return cb(err); }
	}
}
