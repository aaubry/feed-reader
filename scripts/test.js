var PipelineBuilder = require("../bl/PipelineBuilder").PipelineBuilder;
var pipeline = require("../bl/pipeline");
var dbFactory = require("../bl/dbFactory").dbFactory;
var crud = require("../bl/crud");

var builder = new PipelineBuilder();
require("../config/xkcd").configure(builder);

builder.dump();

var feedItems = crud.create(dbFactory, "Items");

pipeline.execute(
	builder.build(),
	{ db: feedItems },
	function() {
		console.log("Done");
	}
);
