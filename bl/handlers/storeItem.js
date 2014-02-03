
exports.builder = function() {
	return {
		name: "Store item",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				//context.db.insertOrUpdate(item, cb);
				context.db.insert(item, item_stored);
			} catch(err) { cb(err); }

			function item_stored(err) {
				cb(err == null || err.code == 11000 ? null : err);
			}
		}
	};
};
