var async = require("async");
var phantom = require("../phantom");
var crypto = require("crypto");
var fs = require("fs");

// args = { htmlField: "body", targetField: "image" }
exports.handler = function(item, args, cb) {

	var fileName = "tmp/" + crypto.randomBytes(4).readUInt32LE(0) + ".html";
	//console.log("EXTRACT IMAGE");

	fs.writeFile(fileName, item[args.htmlField], file_written);

	function file_written(err) {
		if(err) return cb(err);

		phantom.execute("select_best_image.js", fileName, image_extracted);

		function image_extracted(err, imageUrl) {
			fs.unlink(fileName, function(err) { if(err) console.warn(err); });
			if(err) return cb(err);

			//console.log("EXTRACT IMAGE => DONE");
			item[args.targetField] = imageUrl.replace(/[\r\n]/g, "");
			cb(null, item);
		}
	}
};



