var handlers = {};

["fetchFeed", "fetchPages", "map",
 "selectImage", "excludeExisting", "fetchHtml",
 "xpath", "filter"].forEach(function(n) {
	handlers[n] = require("./handlers/" + n);
	if(handlers[n] == null) {
		throw "Badly defined pipeline handler '" + n + "'";
	}
});

exports.PipelineBuilder = function PipelineBuilder() {
	var steps = [];
	
	this.fetchFeed = function(url) {
		steps.push({
			handler: handlers.fetchFeed,
			args: { url: url },
			weight: 3
		});
	};
	
	this.dump = function(handler, name) {
		steps.push({
			handler: {
				handler: function (item, data, context, cb) {
					console.log(item);
					cb(null);
				},
				name: "Dump"
			},
		})
	};
	
	this.custom = function(handler, name) {
		steps.push({
			handler: {
				handler: handler,
				name: name || "Custom"
			},
		})
	};
	
	this.build = function() {
		for(var i = 0; i < steps.length; ++i) {
			if(i > 0) steps[i - 1].next = steps[i];
			steps[i].remaining = steps.length - i;
			steps[i].weight = steps[i].weight || 1;
			
			steps[i].name = steps[i].handler.name;
			steps[i].handler = steps[i].handler.handler;
		}
		
		return steps[0];
	};
}
