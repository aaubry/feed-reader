// args = { field1: "original1", field2: "original2",
//          constantField: "#constant value",
//          templatedField: "$<ul><li>{first}</li><li>{second}</li></ul>" ... }
exports.handler = function(item, fields, context, cb) {
	try {
		var mapped = {};
		for(var name in fields) {
			var sourceName = fields[name];
			switch(sourceName[0]) {
				case "$":
					var template = sourceName.substr(1);
					var value = template.replace(/{(\w+)}/g, function(m, n) {
						return item[n];
					});
					
					mapped[name] = value;
					break;

				case "#":
					mapped[name] = sourceName.substr(1);
					break;
					
				default:
					mapped[name] = item[sourceName];
					break;
			}
		}
		cb(null, mapped);
	} catch(err) { return cb(err); }
};
