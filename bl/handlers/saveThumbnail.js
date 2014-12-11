var fs = require("fs");
var request = require("request");
var spawn = require("child_process").spawn;

exports.builder = function() {
	return {
		name: "Save thumbnail",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				if(item.imageUrl != null) {
					item.thumbUrl = "/thumbs/" + item.id + ".png";

					var convert = spawn("convert", [ "-resize", "100x100^", "-gravity", "center", "-crop", "100x100+0+0", "+repage", "-", "public" + item.thumbUrl ]);

					convert.stdout.on('data', function (data) {
						console.log('OUT: ' + data);
					});

					convert.stderr.on('data', function (data) {
						console.log('ERR: ' + data);
					});

					request(item.imageUrl).pipe(convert.stdin);

					delete item.imageUrl;
					cb(null, item);
					
				} else if(item.imageData != null) {
					item.thumbUrl = "/thumbs/" + item.id + ".png";
					
					var destinationFile = "public" + item.thumbUrl;
					var stream = fs.createWriteStream(destinationFile);
					stream.end(item.imageData, null, image_written);
					
					function image_written(err) {
						delete item.imageData;
						cb(err, item);
					}
				} else {
					cb(null, item);
				}
			} catch(err) { cb(err); }
		}
	};
};
