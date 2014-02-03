
exports.builder = function(projection) {
	return {
		name: "Dump",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				console.log(item);
				cb(null, item);
			} catch(err) { return cb(err); }
		}
	};
};
