// args = 5 <count>
exports.handler = function(data, count, cb) {
	var results = data.slice(0, count);
	cb(null, results);
};
