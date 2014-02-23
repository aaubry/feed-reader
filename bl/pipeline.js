var TaskScheduler = require("./task").TaskScheduler;
var colors = require("colors");

exports.execute = function(initialStep, context, cb) {
	var completedSteps = 0;
	var estimatedSteps = initialStep.remaining;

	var scheduler = new TaskScheduler({
		maxConcurrency: 5,
		mode: "lifo"
	}, cb);

	scheduler.schedule(execute_step, initialStep.weight, initialStep.name, [initialStep, null]);

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

			console.log("%s Completed %d steps of %d".green, new Date(), completedSteps, estimatedSteps);

			if(step.next && err == null) {
				items.forEach(function(i) {	
					scheduler.schedule(execute_step, step.next.weight, step.next.name, [step.next, i]);
				});
			}

			cb(err);
		}
	}
}
