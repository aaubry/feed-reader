var async = require("async");
var phantom = require("../phantom");

exports.builder = function(urlField, targetField) {
	urlField = urlField || "link";
	targetField = targetField || "body";

	return {
		name: "Fetch page from item link",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				var url = item[urlField];
				phantom.execute("extract_main_content.js", url, html_extracted);
			} catch(err) { return cb(err); }

			function html_extracted(err, html) {
				try {
					if(err) return cb(err);

					html = "<html><head><base src='" + url + "' /></head><body>"
						+ html + "</body></html>";

					item[targetField] = html;
					cb(null, item);
				} catch(err) { return cb(err); }
			}
		}
	};
};
