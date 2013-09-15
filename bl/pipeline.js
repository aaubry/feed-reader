var TaskScheduler = require("./task").TaskScheduler;

exports.execute = function(pipeline, context, handlers, cb) {
	var initialStep = parsePipeline(pipeline, handlers);

	var completedSteps = 0;
	var estimatedSteps = initialStep.remaining;

	var scheduler = new TaskScheduler({
		maxConcurrency: 5,
		mode: "lifo"
	}, cb);

	scheduler.schedule(execute_step, initialStep.weight, initialStep.name, initialStep, null);

	function execute_step(step, item, cb) {
		step.handler(item, step.args, context, step_complete);

		function step_complete(err, items) {
			++completedSteps;

			if(step.next) {
				if(err == null) {
					if(items == null) {
						items = [];
					} else if(items.length == undefined) {
						items = [items];
					}

					estimatedSteps += (items.length - 1) * step.next.remaining;
				} else {
					estimatedSteps -= step.next.remaining;
				}
			}

			console.log("Completed %d steps of %d", completedSteps, estimatedSteps);

			if(step.next && err == null) {
				items.forEach(function(i) {	
					scheduler.schedule(execute_step, step.next.weight, step.next.name, step.next, i);
				});
			}

			cb(err);
		}
	}
}

function parsePipeline(pipeline, handlers) {
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
		steps[i].weight = steps[i].handler.weight || 1;
	}

	return steps[0];
}

