var async = require("async");
var phantom = require("../phantom");
var crypto = require("crypto");
var fs = require("fs");

// args = { htmlField: "body", targetField: "image" }
exports.handler = function(data, args, cb) {

	var baseName = "tmp/" + crypto.randomBytes(4).readUInt32LE(0) + "_";
	var idx = 0;
	async.map(data, select_image, cb);

	function select_image(item, cb) {

		var id = ++idx;
		console.log("EXTRACT IMAGE %s", id);

		var fileName = baseName + id + ".html";
		fs.writeFile(fileName, item[args.htmlField], file_written);

		function file_written(err) {
			if(err) return cb(err);

			phantom.execute("select_best_image.js", fileName, image_extracted);

			function image_extracted(err, imageUrl) {
				fs.unlink(fileName, function(err) { if(err) console.log(err); });
				if(err) return cb(err);

				console.log("EXTRACT IMAGE %s => DONE", id);
				item[args.targetField] = imageUrl.replace(/[\r\n]/g, "");
				cb(null, item);
			}
		}
	}

};



