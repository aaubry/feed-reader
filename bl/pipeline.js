var handlers = {};

["fetchFeed", "fetchPages", "map", "take", "selectImage"].forEach(function(n) {
	handlers[n] = require("./handlers/" + n).handler;
	if(handlers[n] == null) {
		throw "Badly defined pipeline handler '" + n + "'";
	}
});

exports.execute = function(pipeline, cb) {
	var idx = 0;
	
	execute_next_step(null, null);
	
	function execute_next_step(err, data) {
		if(err) return cb(err, null);
		if(idx >= pipeline.length) return cb(null, data);

		var step = pipeline[idx++];
		console.log(step);

		for(var handlerName in step) {
			var handler = handlers[handlerName];
			if(handler == null) {
				console.log(handlers);
				return cb("Invalid pipeline element '" + handlerName + "'");
			}
			handler(data, step[handlerName], execute_next_step);
			break;
		}
	}
};

