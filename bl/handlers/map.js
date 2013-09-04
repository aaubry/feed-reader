// args = { field1: "original1", field2: "original2"... }
exports.handler = function(item, fields, cb) {
	var mapped = {};
	for(var name in fields) {
		mapped[name] = item[fields[name]];
	}
	cb(null, mapped);
};

