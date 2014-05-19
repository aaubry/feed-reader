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
					read: true,
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
						query: query,
						unread: null
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
					thumbUrl: true,
					read: true
				};
				
				var categoryId = req.params.id;
				var read = req.params.read || false;
				var category = config.getCategoryById(categoryId);
				var feedIds = category.feeds.map(function(feed) { return feed.id; });
				
				var filter = { feedId: { $in: feedIds } };
				
				if(!req.query.unread) {
					filter.read = false;
				}
								
				coll.find(filter, fields, options).sort({ pubDate: -1 }, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: category,
						query: req.query.q,
						unread: req.query.unread || false
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
					pubDate: true,
					read: true
				};

				var cursor = coll.find({ _id: req.params.id }, fields, options);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					if(items.length != 1) {
						return res.send(404, { error: "Not found" });
					}

					var item = items[0];
					
					if(!item.read) {
						item.read = true;
						coll.update({ _id: item._id }, { $set: { read: true } }, item_marked_as_read);
					}
					
					res.render("home/view", {
						title: item.title,
						item: item,
						query: req.query.q
					});
					
					function item_marked_as_read(err) {
						if(err) console.log(err);
					}
				}
			}
		}
	}

};

