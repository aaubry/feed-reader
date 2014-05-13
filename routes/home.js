var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crud  = require("../bl/crud");
var error = require("../bl/error"),
	handleAppError = error.handleAppError,
	closeOnError = error.closeOnError;

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;
	
var config = require("../config/config");

exports.registerRoutes = function(app, dbFactory) {

	app.get("/", categories);
	app.get("/search", search);
	app.get("/:id", list);
	app.get("/i/:id", view);
	
	function categories(req, res) {
		res.render("home/categories", {
			title: "Categories",
			items: config.getAllCategories(),
			query: req.query.q
		});
	}

	function search(req, res) {

		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, items_collection_opened)));

			function items_collection_opened(coll) {
				var options = {
					limit: 150
				};

				var fields = {
					_id: true,
					feedId: true,
					title: true,
					thumbUrl: true,
					score: { $meta: "textScore" }
				};
				
				var query = req.query.q;
				
				coll.find({ $text: { $search: query } }, fields, options).sort({ score: { $meta: "textScore" } }, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: {
							name: "Search Results"
						},
						query: query
					});
				}
			}
		}
	}
	
	function list(req, res) {

		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, items_collection_opened)));

			function items_collection_opened(coll) {
				var options = {
					limit: 150,
					sort: [["pubDate","asc"]]
				};

				var fields = {
					_id: true,
					feedId: true,
					title: true,
					thumbUrl: true
				};
				
				var categoryId = req.params.id;
				var category = config.getCategoryById(categoryId);
				var feedIds = category.feeds.map(function(feed) { return feed.id; });
				
				coll.find({ feedId: { $in: feedIds } }, fields, options).sort({ pubDate: -1 }, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: category,
						query: req.query.q
					});
				}
			}
		}
	}

	function view(req, res) {
		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, collection_opened)));

			function collection_opened(coll) {
				var options = {
					limit: 1
				};

				var fields = {
					title: true,
					body: true,
					link: true,
					links: true,
					pubDate: true
				};

				var cursor = coll.find({ _id: req.params.id }, fields, options);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					if(items.length != 1) {
						return res.send(404, { error: "Not found" });
					}

					var item = items[0];
					res.render("home/view", {
						title: item.title,
						item: item,
						query: req.query.q
					});
				}
			}
		}
	}

};

