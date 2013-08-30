var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crudController = require("../bl/crudController"),
	handleError = crudController.handleError;

var crud = require("../bl/crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

var pipeline = require("../bl/pipeline");

var crypto = require("crypto");

var async = require("async");

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
		controller.data.getOne(id, handleError(res, feed_retrieved));

		function feed_retrieved(feed) {

			pipeline.execute(feed.item.pipeline, pipeline_result_available);

			function pipeline_result_available(err, items) {
				if(err) return res.send(500, { error: err });

				var feedItems = crud.create(dbFactory, "Items");
				async.each(items, store_item, handleError(res, all_items_stored));

				function store_item(item, cb) {
					var feedItem = {
						_id: crypto.createHash("md5").update(item.guid).digest("hex"),
						feedId: id,

						title: item.title,
						body: item.body,
						guid: item.guid,
						link: item.link,
						imageUrl: item.imageUrl
					};

					feedItems.insert(feedItem, item_stored);

					function item_stored(err) {
						cb(err == null || err.code == 11000 ? null : err);
					}
				}

				function all_items_stored() {
					res.render("feeds/view", { title: feed.item.name, items: items });
				}
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
  {"map":{"title":"title","body":"description","guid":"guid","link":"link"}},
  {"selectImage":{"htmlField":"body","targetField":"imageUrl"}}
]

Hacker News
[
  { "fetchFeed": "https://news.ycombinator.com/rss" },
  { "fetchPages": { "urlField": "link", "targetField": "body" } },
  { "map": { "title": "title", "body": "body", "guid": "comments", "link": "link" } },
  { "selectImage": { "htmlField": "body", "targetField": "imageUrl" } }
]

*/


