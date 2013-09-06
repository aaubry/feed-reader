
// options: { maxConcurrency = 5, mode = "fifo|lifo" }
function TaskScheduler(options, onQueueEmpty) {
	this.queue = [];
	this.runningTaskCount = 0;
	this.onQueueEmpty = onQueueEmpty;

	var availableModes = {
		fifo: Array.prototype.shift,
		lifo: Array.prototype.pop,
	};

	this.dequeue = availableModes[options.mode || "fifo"];
	this.maxConcurrency = options.maxConcurrency || 5;
}

TaskScheduler.prototype.schedule = function(task /* task(arg1, arg2, cb), arg1, arg2 */) {
	var args = Array.prototype.slice.call(arguments, 1);
	this.queue.push({ task: task, args: args });
	if(this.runningTaskCount < this.maxConcurrency) {
		this.runNextTask();
	}
}

TaskScheduler.prototype.runNextTask = function() {
	if(this.queue.length == 0) {
		if(this.onQueueEmpty && this.runningTaskCount == 0) this.onQueueEmpty();
		return;
	}

	++this.runningTaskCount;
	var nextTask = this.dequeue.call(this.queue);
	
	var self = this;
	nextTask.args.push(function(err) {
		if(err) console.log("Task error: %s", err.stack);

		--self.runningTaskCount;
		self.runNextTask();
	});

	nextTask.task.apply(null, nextTask.args);
}

exports.TaskScheduler = TaskScheduler;
