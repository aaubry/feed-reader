var async = require("async");
var phantom = require("../phantom");
var crypto = require("crypto");
var fs = require("fs");

// args = { htmlField: "body", targetField: "image" }
exports.handler = function(item, args, context, cb) {

	try {
		var fileName = "tmp/" + crypto.randomBytes(4).readUInt32LE(0) + ".html";
		fs.writeFile(fileName, item[args.htmlField], file_written);
	} catch(err) { return cb(err); }

	function file_written(err) {
		try {
			if(err) return cb(err);
			phantom.execute("select_best_image.js", fileName, image_extracted);
		} catch(err) { return cb(err); }

		function image_extracted(err, imageUrl) {
			try {
				fs.unlink(fileName, function(err) { if(err) console.warn(err); });
				if(err) return cb(err);

				item[args.targetField] = imageUrl.replace(/[\r\n]/g, "");
				cb(null, item);
			} catch(err) { return cb(err); }
		}
	}
};



