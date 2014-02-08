
exports.builder = function(predicate) {
	return {
		name: "Filter",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				cb(null, predicate(item) ? item : null);
			} catch(err) { return cb(err); }
		}
	};
};
