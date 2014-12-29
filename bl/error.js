function handleAppError(res, cb) {
	if(res == null) throw new Error("handleAppError: res is null");
	if(cb == null) throw new Error("handleAppError: cb is null");
	if(typeof(cb) != "function") throw new Error("handleAppError: cb is not a function: " + typeof(cb));

	return function(err, val) {
		if(err) {
			console.log(err);
			res.send(500, { error: err });
		} else {
			cb(val);
		}
	};
};

exports.handleAppError = handleAppError;

function closeOnError(/*obj1, obj2, obj3, cb*/) {
	var args = arguments;
	return function(err, res) {
		if(err) {
			for(var i = args.length - 2; i >= 0; --i) {
				args[i].close();
			}
			
			console.log(err);
		}
		return args[args.length - 1](err, res);
	};
}

exports.closeOnError = closeOnError;
