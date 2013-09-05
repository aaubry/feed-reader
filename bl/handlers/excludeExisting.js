var crypto = require("crypto");

// args = null
exports.handler = function(item, args, context, cb) {
	try {
		var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
		context.db.exists(itemId, exists_available);
	} catch(err) { return cb(err); }

	function exists_available(err, exists) {
		cb(err, exists ? null : item);
	}
};
