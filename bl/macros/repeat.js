exports.exec = function(times, config) {
	for(var i = 0; i < times; ++i) {
		config(this, i);
	}
};
