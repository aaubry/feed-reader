var async = require("async");
var TaskScheduler = require("./task").TaskScheduler;

var handlers = {};

["fetchFeed", "fetchPages", "map", "selectImage", "excludeExisting"].forEach(function(n) {
	handlers[n] = require("./handlers/" + n).handler;
	if(handlers[n] == null) {
		throw "Badly defined pipeline handler '" + n + "'";
	}
});

exports.execute = function(pipeline, context, cb) {
	var initialStep = parsePipeline(pipeline);

	var completedSteps = 0;
	var estimatedSteps = initialStep.remaining;

	var scheduler = new TaskScheduler({
		maxConcurrency: 5,
		mode: "lifo"
	}, cb);

	scheduler.schedule(execute_step, initialStep, null);

	function execute_step(step, item, cb) {
		step.handler(item, step.args, context, step_complete);

		function step_complete(err, items) {
			++completedSteps;

			if(step.next && err == null) {
				if(items == null) {
					items = [];
				} else if(items.length == undefined) {
					items = [items];
				}

				estimatedSteps += (items.length - 1) * step.next.remaining;
			}

			console.log("Completed %d steps of %d - %s", completedSteps, estimatedSteps, step.name);

			if(step.next && err == null) {
				items.forEach(function(i) {	
					scheduler.schedule(execute_step, step.next, i);
				});
			}

			cb(err);
		}
	}
}

function parsePipeline(pipeline) {
	if(pipeline.length == 0) throw "Empty pipeline";

	var steps = pipeline.map(function(s) {
		if(typeof(s) == "function") {
			var name = /function (\w+)/.exec(s)[1];
			return { handler: s, args: null, name: name };
		}
		for(var handlerName in s) {
			var handler = handlers[handlerName];
			if(handler == null) {
				console.log(handlers);
				throw "Invalid pipeline element '" + handlerName + "'";
			}
			return { handler: handler, args: s[handlerName], name: handlerName };
		}
		console.log(s);
		throw "Invalid pipeline element '???'";
	});

	for(var i = 1; i < steps.length; ++i) {
		steps[i - 1].next = steps[i];
	}

	for(var i = 0; i < steps.length; ++i) {
		steps[i].remaining = steps.length - i;
	}

	return steps[0];
}

