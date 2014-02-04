var async = require("async");
var phantom = require("../phantom");
var crypto = require("crypto");
var fs = require("fs");

exports.builder = function(htmlField, targetField) {
	htmlField = htmlField || "body";
	targetField = targetField || "imageData";

	return {
		name: "Select image from body",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				var fileName = "tmp/" + crypto.randomBytes(4).readUInt32LE(0) + ".html";
				fs.writeFile(fileName, item[htmlField], file_written);
			} catch(err) { return cb(err); }

			function file_written(err) {
				try {
					if(err) return cb(err);
					phantom.execute("select_best_image.js", fileName, "100", "100", image_extracted);
				} catch(err) { return cb(err); }

				function image_extracted(err, imageData) {
					try {
						fs.unlink(fileName, function(err) { if(err) console.warn(err); });
						if(err) return cb(err);
						
						item[targetField] = imageData.length > 100 ? new Buffer(imageData, "base64") : null;
						cb(null, item);
					} catch(err) { return cb(err); }
				}
			}
		}
	};
};
