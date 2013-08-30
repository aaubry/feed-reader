var async = require("async");
var phantom = require("../phantom");

// args = { urlField: "link", targetField: "body" }
exports.handler = function(data, args, cb) {
	async.map(data, fetch_page, cb);

	function fetch_page(item, cb) {
		var url = item[args.urlField];
		console.log("GET HTML %s", url);

		phantom.execute("extract_main_content.js", url, html_extracted);

		function html_extracted(err, html) {
			if(err) return cb(err);

			console.log("GET HTML %s => DONE", url);
			item[args.targetField] = html;
			cb(null, item);
		}
	}
};
