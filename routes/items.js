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

	app.get("/item", list);
	app.get("/item/:id", view);

	function list(req, res) {

		var db = dbFactory();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, collection_opened)));

			function collection_opened(coll) {
				var options = {
					limit: 50,
					sort: [["pubDate","asc"]]
				};

				var fields = {
					_id: true,
					feedId: true,
					title: true,
					thumbUrl: true
				};

				var cursor = coll.find({}, fields, options);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					res.render("items/list", {
						title: "Feed Items",
						items: items
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
					pubDate: true
				};

				var cursor = coll.find({ _id: req.params.id }, fields, options);
				cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));

				function items_retrieved(items) {
					if(items.length != 1) {
						res.send(404, { error: "Not found" });
					}

					var item = items[0];
					res.render("items/view", {
						title: item.title,
						item: item
					});
				}
			}
		}
	}

};

