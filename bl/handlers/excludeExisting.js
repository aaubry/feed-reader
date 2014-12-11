var crypto = require("crypto");

exports.builder = function() {
	return {
		name: "Exclude existing",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
				context.esClient.exists({ index: "feeds", type: "item", id: itemId }, exists_available);
			} catch(err) { return cb(err); }

			function exists_available(err, exists) {
				cb(err, exists ? null : item);
			}
		}
	};
};
