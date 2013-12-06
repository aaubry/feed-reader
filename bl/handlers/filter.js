// args = { predicate: "item.a == 'b'" }
exports.handler = function(item, args, context, cb) {
	try {
		var predicate = new Function("item", args.predicate.indexOf("return") >= 0 ? args.predicate : "return " + args.predicate);
		cb(null, predicate(item) ? item : null);
	} catch(err) { return cb(err); }
};
