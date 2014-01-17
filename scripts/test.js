var PipelineBuilder = require("../bl/PipelineBuilder").PipelineBuilder;
var smbc = require("../config/smbc");
var pipeline = require("../bl/pipeline");

var builder = new PipelineBuilder();
smbc.configure(builder);

builder.dump();

pipeline.execute(
	builder.build(),
	{},
	function() {
		console.log("Done");
	}
);
