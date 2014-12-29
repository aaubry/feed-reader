var async = require("async");
var phantom = require("../phantom");

exports.builder = function(urlField, targetField, selector, exclusions) {
	urlField = urlField || "link";
	targetField = targetField || "body";

	return {
		name: "Fetch page from item link",
		weight: 3,
		handler: function(item, args, context, cb) {
			try {
				var url = item[urlField];
				phantom.execute("extract_main_content.js", "-q", url, selector, exclusions, html_extracted);
			} catch(err) { return cb(err); }

			function html_extracted(err, jsonData) {
				try {
					if(err) return cb(err);

					var data = JSON.parse(jsonData);
					item[targetField] = data.body;
					item.meta = data.meta;
					cb(null, item);

				} catch(err) { return cb(err); }
			}
		}
	};
};
