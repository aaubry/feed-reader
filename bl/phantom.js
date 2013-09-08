var spawn = require("child_process").spawn;

exports.execute = function(scriptFileName /*, arg1, arg2, arg3, cb*/) {
	if(arguments.length < 2) throw "Invalid arguments";

	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "phantom_scripts/" + args[0];

	var cb = args.pop();
	args.unshift("--web-security=no");

	var stdout = [];
	var stderr = [];
	var process = spawn("phantomjs", args);
	process.stdout.setEncoding("utf8");
	process.stdout.on("data", on_process_stdout);
	process.stderr.setEncoding("utf8");
	process.stderr.on("data", on_process_stderr);
	process.on("close", on_process_closed);

	function on_process_stdout(data) {
		stdout.push(data.toString());
	}

	function on_process_stderr(data) {
		stderr.push(data.toString());
	}

	function on_process_closed(code) {
		if(code != 0) return cb({
			error: "phantomjs exited with code " + code,
			stdout: stdout.join(""),
			stderr: stderr.join(""),
			args: args
		}, null);
		cb(null, stdout.join(""));
	}
}



