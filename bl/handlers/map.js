// args = { field1: "original1", field2: "original2"... }
exports.handler = function(data, fields, cb) {
	var results = data.map(function(original) {
		var mapped = {};
		for(var name in fields) {
			mapped[name] = original[fields[name]];
		}
		return mapped;
	});
	cb(null, results);
};

