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
        var categories = crud.create(dbFactory, "Categories");

	var controller = crudController.create(dbFactory, "Feeds", "Feed", "name", function(cb) {
                categories.getAll({}, "name", function(err, res) {
                    if(err) return cb(err);

                    var choices = {};
                    res.items.forEach(function(i) { choices[i._id] = i.name; });

                    cb(null, forms.create({
			name: fields.string({required: true}),
                        category: fields.string({
                                required: true,
                                widget: widgets.select(),
                                choices: choices
                        }),
			pipeline: fields_object({required: true, widget: widgets.textarea()})
		    }));
		});
	});

	controller.registerRoutes(app);
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

Saturday Morning Breakfast Cereals

[
  { "fetchFeed": { "url": "http://feeds.feedburner.com/smbc-comics/PvLb?format=xml" } },
  { "map" : { "title": "title", "guid": "link", "link": "link", "body":"description" } },
  {"excludeExisting":null},
  {"selectImage":{"htmlField":"body","targetField":"imageData"}}
]

http://stackoverflow.com/feeds/tag?tagnames=yamldotnet&sort=newest

*/


