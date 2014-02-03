var spawn = require("child_process").spawn;
var libxmljs = require("libxmljs");

exports.builder = function(itemsQuery, itemBuilder, namespaces, htmlField) {
	namespaces = namespaces || { "h" : "http://www.w3.org/1999/xhtml" };
	htmlField = htmlField || "html";

	return {
		name: "Extract items using XPATH",
		weight: 3,
		handler: function(item, args, context, cb) {

			var html = item[htmlField];

			var stdout = [];
			var stderr = [];
			var process = spawn("tidy", ["-asxhtml", "-q"]);
			process.stdout.setEncoding("utf8");
			process.stdout.on("data", on_process_stdout);
			process.stderr.setEncoding("utf8");
			process.stderr.on("data", on_process_stderr);
			process.on("close", on_process_closed);
			
			process.stdin.end(html);
			
			function on_process_stdout(data) {
				stdout.push(data.toString());
			}

			function on_process_stderr(data) {
				stderr.push(data.toString());
			}

			function on_process_closed(code) {
				if(code > 1) return cb({
					error: "tidy exited with code " + code,
					stdout: stdout.join(""),
					stderr: stderr.join("")
				}, null);

				var xhtml = stdout.join("");
				var doc = libxmljs.parseXml(xhtml);

				var results = doc.find(itemsQuery, namespaces);
				
				var items = results.map(function(r) {
					var item = {};
					for(var name in itemBuilder) {
						item[name] = r.get(itemBuilder[name], namespaces).text();
					}
					
					item.x = r.get("h:td[1]//h:span//text()", namespaces).text();
					
					return item;
				});

				cb(null, items);
			}
		}
	};
};
