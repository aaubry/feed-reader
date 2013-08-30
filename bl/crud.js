var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

exports.create = function(dbFactory, collection) {

	var getPage = function(filter, pageNumber, sortField, cb /* ({ items: [], pages: { current, total } }) */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				var page = Math.max(1, pageNumber || 1);
				var pageSize = 10;

				var options = {
					limit: pageSize,
					skip: (page - 1) * pageSize,
					sort: sortField
				};

				var cursor = coll.find(filter, options);
				cursor.count(function(err, total) {
					if(err) { cursor.close(); db.close(); cb(err, null); return; }

					cursor.toArray(function(err, items) {
						cursor.close();
						db.close(); 

						if(err) { cb(err, null); return; }
						cb(null, {
							pages: { current: page, total: Math.ceil(total / pageSize) },
							items: items
						});
					});
				});
			});
		});
	};

	var getAll = function(filter, sortField, cb /* ({ items: [] }) */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				var options = {
					sort: sortField
				};

				var cursor = coll.find(filter, options);
				cursor.toArray(function(err, items) {
					cursor.close();
					db.close(); 

					if(err) { cb(err, null); return; }
					cb(null, {
						items: items
					});
				});
			});
		});
	};

	var getOne = function(id, cb /* { item } */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				coll.findOne({ _id: id }, function(err, item) {
					db.close(); 

					if(err) { cb(err, null); return; }
					cb(null, {
						item: item
					});
				});
			});
		});
	};

	var updateOne = function(id, item, cb /* { } */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				coll.update(
					{ _id: id },
					item,
					function(err) {
						db.close();
						cb(err, null);
					}
				);
			});
		});
	};

	var removeOne = function(id, cb /* { } */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				coll.remove({ _id: id }, function(err) {
					db.close();
					cb(err, null);
				});
			});
		});
	};

	var insert = function(item, cb /* { } */) {
		var db = dbFactory();
		db.open(function(err, conn) {
			if(err) { db.close(); cb(err, null); return; }

			conn.collection(collection, function(err, coll) {
				if(err) { db.close(); cb(err, null); return; }

				coll.insert(item, function(err) {
					db.close();
					cb(err, null);
				});
			});
		});
	};

	return {
		getPage: getPage,
		getAll: getAll,
		getOne: getOne,
		updateOne: updateOne,
		removeOne: removeOne,
		insert: insert
	};
};
