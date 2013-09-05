var async = require("async");
var phantom = require("../phantom");

// args = { urlField: "link", targetField: "body" }
exports.handler = function(item, args, context, cb) {
	try {
		var url = item[args.urlField];
		phantom.execute("extract_main_content.js", url, html_extracted);
	} catch(err) { return cb(err); }

	function html_extracted(err, html) {
		try {
			if(err) return cb(err);

			html = "<html><head><base src='" + url + "' /></head><body>"
				+ html + "</body></html>";

			item[args.targetField] = html;
			cb(null, item);
		} catch(err) { return cb(err); }
	}
};
