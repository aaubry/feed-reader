var program = require("commander");
var feedPoller = require("../bl/feedPoller");
var dbFactory = require("../bl/dbFactory").dbFactory;

program
	.version("0.0.1")
	.option("-d, --daemon [period]", "run every [period] minutes", Number, 60)
	.option("-f, --feed <feedId>", "poll only the specified feed")
	.option("-t, --test", "enable test mode")
	.parse(process.argv);

function execute() {
	console.log("");
	console.log("#############");
	console.log("## POLLING ##");
	console.log("#############");
	console.log("");
	
	if(program.feed) {
		feedPoller.poll(dbFactory, program.feed, program.test ? print_item : null, poll_complete);
	} else {
		feedPoller.pollAll(dbFactory, poll_complete);
	}
}

function print_item(item, data, context, cb) {
	console.log(item);
	cb(null);
}


function poll_complete(err) {
	if(err) console.log(err);
	if(program.daemon) setTimeout(execute, program.daemon * 60 * 1000);
}

execute();
