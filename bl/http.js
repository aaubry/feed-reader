var request = require("request");
var zlib = require("zlib");
var iconv = require("iconv");

exports.get = function(url, headers, encoding, cb) {
	if(arguments.length == 2) {
		cb = headers;
		headers = null;
		encoding = null;
	} else if(arguments.length == 3) {
		cb = encoding;
		encoding = null;
	}
	
	try {
		var options = { url: url, headers: headers };
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
						cb(err, response, decoded && bufferToString(decoded));
					});
				} else if (encoding == "deflate") {
					zlib.inflate(buffer, function(err, decoded) {
						cb(err, response, decoded && bufferToString(decoded));
					})
				} else {
					cb(null, response, bufferToString(buffer));
				}
			 });
			 
			 function bufferToString(data) {
				if(encoding != null) {
					converter = new iconv.Iconv(encoding, "utf8");
					data = converter.convert(data);
				}
				return data.toString();
			 }
		});

		req.on("error", cb);
	} catch(err) { return cb(err); }
}
