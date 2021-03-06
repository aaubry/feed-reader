
exports.builder = function(projection) {
	return {
		name: "Transform items",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				var mapped = projection(item);
				cb(null, mapped);
			} catch(err) { return cb(err); }
		}
	};
};
