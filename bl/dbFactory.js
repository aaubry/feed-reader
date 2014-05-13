var mongodb = require("mongodb"),
	Db = mongodb.Db,
	Server = mongodb.Server;

var error = require("./error"),
	handleAppError = error.handleAppError,
	closeOnError = error.closeOnError;
	
exports.dbFactory = function() {
	return new Db("Feeds", new Server("localhost", 27017), { w: 1 });
};

exports.initialize = function(cb) {
	var db = exports.dbFactory();
	
	db.open(closeOnError(db, db_opened));
	
	function db_opened(err, conn) {
		if(err) return cb(err);
	
		conn.collection("Items", closeOnError(db, items_collection_opened));

		function items_collection_opened(err, coll) {
			if(err) return cb(err);
			
			coll.ensureIndex({ title: "text", body: "text" }, cb);
		}
	}
};
