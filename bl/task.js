var colors = require("colors");

// options: { maxConcurrency = 5, mode = "fifo|lifo" }
function TaskScheduler(options, onQueueEmpty) {
	this.queue = [];
	this.running = [];
	this.runningTaskCount = 0;
	this.onQueueEmpty = onQueueEmpty;

	var availableModes = {
		fifo: {
			dequeue: Array.prototype.shift,
			peek: function() { return this[0]; }
		},
		lifo: {
			dequeue: Array.prototype.pop,
			peek: function() { return this[this.length - 1]; }
		}
	};

	this.accessors = availableModes[options.mode || "fifo"];
	this.maxConcurrency = options.maxConcurrency || 5;
}

TaskScheduler.prototype.schedule = function(task, weight, name /* task(arg1, arg2, cb), arg1, arg2 */) {
	var args = Array.prototype.slice.call(arguments, 3);
	this.queue.push({ task: task, args: args, weight: weight, name: name });
	this.runNextTask();
}

TaskScheduler.prototype.runNextTask = function() {
	if(this.queue.length == 0) {
		this.displayStatus();
		if(this.onQueueEmpty && this.runningTaskCount == 0) this.onQueueEmpty();
		return;
	}
	
	var nextTask = this.accessors.peek.call(this.queue);

	if(this.running.length != 0 && this.runningTaskCount + nextTask.weight > this.maxConcurrency) {
		this.displayStatus();
		return;
	}
	
	this.accessors.dequeue.call(this.queue);

	var self = this;
	self.runningTaskCount += nextTask.weight;
	self.running.push(nextTask);
	self.displayStatus();
	
	nextTask.args.push(function(err) {
		if(err) {
			if(err.stack) {
				console.log("Task error: %s".red, err.stack);
			} else {
				console.log("Task error: ".red, err);
			}
		}

		self.runningTaskCount -= nextTask.weight;
		self.running.splice(self.running.indexOf(nextTask), 1);
		
		self.runNextTask();
	});

	nextTask.task.apply(null, nextTask.args);
}

TaskScheduler.prototype.displayStatus = function() {
	console.log(
		"Running tasks: [ %s ] (%d queued: [ %s ])".magenta,
		this.running.reduce(function(p, c) { return p.length > 0 ? p + ", " + c.name : c.name; }, ""),
		this.queue.length,
		this.queue.slice(0, 5).reduce(function(p, c) { return p.length > 0 ? p + ", " + c.name : c.name; }, "")
	);
}

exports.TaskScheduler = TaskScheduler;
