var fs = require("fs");

exports.builder = function() {
	return {
		name: "Save thumbnail",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				if(item.imageData != null) {
					item.thumbUrl = "/thumbs/" + item._id + ".png";
					
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
