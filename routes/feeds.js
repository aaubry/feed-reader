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
var async = require("async");
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
			if(feed.item == null) return res.send(404, { error: "Not found" });

			var finalSteps = [format_item, save_thumbnail, store_item];
			pipeline.execute(
				feed.item.pipeline.concat(finalSteps),
				{ db: feedItems },
				pipeline_complete
			);

			function format_item(item, data, context, cb) {
				try  {
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
						imageData: item.imageData
					};
					cb(null, feedItem);
				} catch(err) { cb(err); }
			}

			function save_thumbnail(item, data, context, cb) {
				try {
					if(item.imageData != null) {
						item.thumbUrl = "/thumbs/" + item._id + ".png";
						
						var destinationFile = "public" + item.thumbUrl;
						var stream = fs.createWriteStream(destinationFile);
						stream.end(item.imageData, null, image_written);
						
						function image_written(err) {
							delete item.imageData;
							cb(err, item);
						}
					} else {
						cb(null, item);
					}
				} catch(err) { cb(err); }
			}

			function store_item(item, data, context, cb) {
				try {
					feedItems.insert(item, item_stored);
				} catch(err) { cb(err); }

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

	app.post(controller.path + "/:id/poll", controller.poll);
};

/*

Coding Horror
[
  {"fetchFeed": { "url":"http://feeds.feedburner.com/codinghorror/" }},
  {"map":{"title":"title","body":"description","guid":"guid","link":"link","pubDate":"pubDate"}},
  {"excludeExisting":null},
  {"selectImage":{"htmlField":"body","targetField":"imageData"}}
]

Hacker News
[
  { "fetchFeed": { "url":"https://news.ycombinator.com/rss"} },
  { "map": { "title": "title", "guid": "comments", "link": "link" } },
  {"excludeExisting":null},
  { "fetchPages": { "urlField": "link", "targetField": "body" } },
  { "selectImage": { "htmlField": "body", "targetField": "imageData" } }
]

http://stackoverflow.com/feeds/tag?tagnames=yamldotnet&sort=newest

*/


