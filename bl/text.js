
// format("Hello, {name}!", { name: "world" })
exports.format = function(template, item) {
	return template.replace(/{(\w+)}/g, function(m, n) {
		return item[n];
	});
};
