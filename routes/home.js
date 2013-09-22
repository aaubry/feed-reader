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

exports.registerRoutes = function(app, dbFactory) {

	app.get("/", categories);
	app.get("/:id", list);
	app.get("/i/:id", view);

	function categories(req, res) {
		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Categories", closeOnError(db, handleAppError(res, collection_opened)));

			function collection_opened(coll) {
				var cursor = coll.find({});
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					res.render("home/categories", {
						title: "Categories",
						items: items
					});
				}
			}
		}
	}

	function list(req, res) {

		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Feeds", closeOnError(db, handleAppError(res, feeds_collection_opened)));

			function feeds_collection_opened(coll) {
				var fields = {
					_id: true,
					name: true,
				};

				var cursor = coll.find({ category: req.params.id }, fields);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, feeds_retrieved)));

				function feeds_retrieved(feeds) {
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
						
						var feedIds = feeds.map(function(i) { return i._id; });
						coll.find({ feedId: { $in: feedIds } }, fields, options).sort({ pubDate: -1 }, closeOnError(db, handleAppError(res, items_sorted)));

						function items_sorted(cursor) {
							cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
						}

						function items_retrieved(items) {
							res.render("home/list", {
								title: "Feed Items",
								items: items
							});
						}
					}
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
						item: item
					});
				}
			}
		}
	}

};

