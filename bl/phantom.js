var spawn = require("child_process").spawn;

exports.execute = function(scriptFileName /*, arg1, arg2, arg3, cb*/) {
	if(arguments.length < 2) throw "Invalid arguments";

	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "phantom_scripts/" + args[0];

	var cb = args.pop();

	var output = [];
	var process = spawn("phantomjs", args);
	process.stdout.setEncoding("utf8");
	process.stdout.on("data", on_process_output);
	process.on("close", on_process_closed);

	function on_process_output(data) {
		output.push(data.toString());
	}

	function on_process_closed(code) {
		if(code != 0) return cb("phantomjs exited with code " + code, null);
		cb(null, output.join(""));
	}
}



