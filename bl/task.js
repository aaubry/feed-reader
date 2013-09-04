function TaskScheduler(maxConcurrency, onQueueEmpty) {
	this.queue = [];
	this.maxConcurrency = maxConcurrency;
	this.runningTaskCount = 0;
	this.onQueueEmpty = onQueueEmpty;
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
	var nextTask = this.queue.shift();
	
	var self = this;
	nextTask.args.push(function(err) {
		if(err) console.log("Task error:", err);

		--self.runningTaskCount;
		self.runNextTask();
	});

	nextTask.task.apply(null, nextTask.args);
}

exports.TaskScheduler = TaskScheduler;
