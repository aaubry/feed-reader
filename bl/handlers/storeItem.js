
exports.builder = function() {
	return {
		name: "Store item",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				var date = item.pubDate;
				
				context.esClient.index({
					index: "feeds",
					type: "item",
					id: item.id,
					body: item
				}, cb);
			} catch(err) { cb(err); }

			function item_stored(err) {
				cb(err);
			}
		}
	};
};
