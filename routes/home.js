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

	app.get("/robots.txt", robots);
	
	app.get("/", categories);
	app.get("/search", search);
	app.get("/:id", list);
	app.get("/i/:id", view);
	
	function categories(req, res) {
		
		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, items_collection_opened)));

			function items_collection_opened(coll) {
				
				var categoryItems = config.getAllCategories().map(function(cat) {
					return {
						id: cat.id,
						name: cat.name,
						feeds: cat.feeds,
						unread: 0
					};
				});
				
				var remaining = categoryItems.length;
				
				categoryItems.forEach(function(category) {
					
					var feedIds = category.feeds.map(function(feed) { return feed.id; });
					
					coll.aggregate([
						{ $match: { feedId: { $in: feedIds }, read: false } },
						{ $group: { _id: null, count: { $sum: 1 } } }
					], closeOnError(db, handleAppError(res, items_counted)));
					
					function items_counted(result) {
						if(result.length > 0) category.unread = result[0].count;
						
						if(--remaining == 0) {
							res.render("home/categories", {
								title: "Categories",
								items: categoryItems,
								query: req.query.q,
								feeds: null
							});
						}
					}
				});
			}
		}
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
				
				var queryText = req.query.q;
				var queryFeed = req.query.f;
				
				var query = { $text: { $search: queryText } };
				if(queryFeed) {
					query.feedId = { $in: queryFeed.split(',') };
				}
				
				coll.find(query, fields, options).sort({ score: { $meta: "textScore" } }, closeOnError(db, handleAppError(res, items_sorted)));

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
						query: queryText,
						feeds: queryFeed,
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
				var category = config.getCategoryById(categoryId);
				var feedIds = category.feeds.map(function(feed) { return feed.id; });
				
				var filter = { feedId: { $in: feedIds } };
				
				if(!req.query.unread && req.user != null) {
					filter.read = false;
				}
								
				coll.find(filter, fields, options).sort({ pubDate: -1 }, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					if(!req.user) items.forEach(function(i) { i.read = false; });
					
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: category,
						query: req.query.q,
						feeds: feedIds.join(','),
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
					read: true,
					feedId: true
				};

				var cursor = coll.find({ _id: req.params.id }, fields, options);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					if(items.length != 1) {
						return res.send(404, { error: "Not found" });
					}

					var item = items[0];
					
					if(!item.read && req.user) {
						item.read = true;
						coll.update({ _id: item._id }, { $set: { read: true } }, item_marked_as_read);
					}
					
					res.render("home/view", {
						title: item.title,
						item: item,
						query: req.query.q,
						feeds: item.feedId
					});
					
					function item_marked_as_read(err) {
						if(err) console.log(err);
					}
				}
			}
		}
	}

	function robots(req, res) {
		res.send("User-agent: *\nDisallow: /");
	}
};

