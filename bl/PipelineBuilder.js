var fs = require("fs");

exports.PipelineBuilder = function PipelineBuilder() {
	this._steps = [];

	this.custom = function(handler, name) {
		_steps.push({
			handler: {
				handler: handler,
				name: name || "Custom"
			},
		})
		return this;
	};
	
	this.build = function() {
		var steps = this._steps;
		for(var i = 0; i < steps.length; ++i) {
			if(i > 0) steps[i - 1].next = steps[i];
			steps[i].remaining = steps.length - i;
			steps[i].weight = steps[i].weight || 1;
		}
		
		return steps[0];
	};
}

exports.PipelineBuilder.prototype = {};

fs.readdirSync("./bl/handlers").forEach(function(handlerFileName) {
	var name = /^(.*)\.js$/.exec(handlerFileName)[1];
	var handler = require("./handlers/" + name);
	exports.PipelineBuilder.prototype[name] = function() {
		this._steps.push(handler.builder.apply(null, arguments));
		return this;
	};
});

fs.readdirSync("./bl/macros").forEach(function(macroFileName) {
	var name = /^(.*)\.js$/.exec(macroFileName)[1];
	var handler = require("./macros/" + name);
	exports.PipelineBuilder.prototype[name] = function() {
		handler.exec.apply(this, arguments);
		return this;
	};
});
