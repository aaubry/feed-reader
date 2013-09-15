var feedPoller = require("../bl/feedPoller");
var dbFactory = require("../bl/dbFactory").dbFactory;

var args = process.argv.splice(2);
if(args.length == 1) {
	feedPoller.poll(dbFactory, args[0], function(err) {
		if(err) console.log(err);
	});
} else {
	feedPoller.pollAll(dbFactory, function(err) {
		if(err) console.log(err);
	});
}
