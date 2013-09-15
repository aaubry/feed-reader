var mongodb = require("mongodb"),
	Db = mongodb.Db,
	Server = mongodb.Server;
	
exports.dbFactory = function() {
	return new Db("Feeds", new Server("localhost", 27017), { w: 1 });
};

