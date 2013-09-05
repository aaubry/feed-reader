var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crudController = require("../bl/crudController");
var handleAppError = require("../bl/error").handleAppError;

var crud = require("../bl/crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

var pipeline = require("../bl/pipeline");

var crypto = require("crypto");
var request = require("request");
var filed = require("filed");
var async = require("async");
var spawn = require("child_process").spawn;
var fs = require("fs");

var fields_object = function (opt) {
    if (!opt) { opt = {}; }
    var f = fields.string(opt);

	var originalBind = f.bind;
	f.bind = function(raw_data) {
		if(typeof(raw_data) === "object") {
			raw_data = JSON.stringify(raw_data);
		}

		return originalBind.call(this, raw_data);
	};

	f.parse = function(raw_data) {
		if(typeof(raw_data) === "object") {
			return raw_data;
		} else {
			var json = String(raw_data);
			return (/^\s*$/).test(json)
				? null
				: JSON.parse(json);
		}
	};

    return f;
};

exports.registerRoutes = function(app, dbFactory) {
	var controller = crudController.create(dbFactory, "Feeds", "Feed", "name", function(cb) {
		cb(null, forms.create({
			name: fields.string({required: true}),
			pipeline: fields_object({required: true, widget: widgets.textarea()})
		}));
	});

	controller.poll = function(req, res) {

		var id = ObjectID.createFromHexString(req.params.id);
		controller.data.getOne(id, handleAppError(res, feed_retrieved));

		var feedItems = crud.create(dbFactory, "Items");

		function feed_retrieved(feed) {

			var finalSteps = [format_item, generate_thumbnail, store_item];
			pipeline.execute(
				feed.item.pipeline.concat(finalSteps),
				{ db: feedItems },
				pipeline_complete
			);

			function format_item(item, data, context, cb) {
				var pubDate	= new Date(item.pubDate);
				if(!(pubDate.valueOf() > 0)) pubDate = new Date();

				var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
				var feedItem = {
					_id: itemId,
					feedId: id,

					title: item.title,
					body: item.body,
					guid: item.guid,
					link: item.link,
					pubDate: pubDate,
					imageUrl: item.imageUrl
				};
				cb(null, feedItem);
			}

			function generate_thumbnail(item, data, context, cb) {
				if(item.imageUrl != null && item.imageUrl.length > 0) {
					item.thumbUrl = "/thumbs/" + item._id + ".png";

					var sourceFile = "tmp/" + item._id;
					var destinationFile = "public" + item.thumbUrl;

					var downloadFile = filed(sourceFile);
					downloadFile.on("end", image_downloaded);
					downloadFile.on("error", cb);
					request(item.imageUrl).pipe(downloadFile);

					function image_downloaded() {
						var process = spawn("convert", ["-format", "png", "-thumbnail", "100x100", sourceFile, destinationFile]);
						process.on("close", on_process_closed);

						function on_process_closed(code) {
							fs.unlink(sourceFile, function(err) { if(err) console.log(err); });
							if(code != 0) return cb("mogrify exited with code " + code, null);
							cb(null, item);
						}						
					}
				} else {
					cb(null, item);
				}
			}

			function store_item(item, data, context, cb) {
				feedItems.insert(item, item_stored);

				function item_stored(err) {
					cb(err == null || err.code == 11000 ? null : err);
				}
			}

			function pipeline_complete(err) {
				if(err) return res.send(500, { error: err });
				console.log("pipeline_complete");

				return res.send(200, { status: "Success" });
			}
		}
	};

	controller.registerRoutes(app);

	// TODO: Should be post	
	app.get(controller.path + "/:id/poll", controller.poll);
};

/*

Coding Horror
[
  {"fetchFeed":"http://feeds.feedburner.com/codinghorror/"},
  {"map":{"title":"title","body":"description","guid":"guid","link":"link","pubDate":"pubDate"}},
  {"selectImage":{"htmlField":"body","targetField":"imageUrl"}}
]

Hacker News
[
  { "fetchFeed": "https://news.ycombinator.com/rss" },
  { "fetchPages": { "urlField": "link", "targetField": "body" } },
  { "map": { "title": "title", "body": "body", "guid": "comments", "link": "link" } },
  { "selectImage": { "htmlField": "body", "targetField": "imageUrl" } }
]

Test
[
  {"fetchFeed":"http://feeds.feedburner.com/codinghorror/"},
  {"take": 1},
  {"map":{"title":"title","body":"description","guid":"guid","link":"link","pubDate":"pubDate"}},
  {"selectImage":{"htmlField":"body","targetField":"imageUrl"}},
  {"thumbnail":{"sourceField":"imageUrl","targetField":"imageUrl"}}
]


http://stackoverflow.com/feeds/tag?tagnames=yamldotnet&sort=newest

*/


