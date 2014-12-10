var crypto = require("crypto");

exports.builder = function() {
	return {
		name: "Exclude existing",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
				context.esClient.search({ index: "feeds-*", q: "id:" + itemId, searchType: "count" }, exists_available);
			} catch(err) { return cb(err); }

			function exists_available(err, response) {
				cb(err, response.hits.total != 0 ? null : item);
			}
		}
	};
};