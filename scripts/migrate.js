var mongodb = require("mongodb"),
	Db = mongodb.Db,
	Server = mongodb.Server;

var elasticsearch = require("elasticsearch");

var esClient = elasticsearch.Client({ host: "localhost:9200" });
var db = Db("Feeds", new Server("localhost", 27017), { w: 1 });

db.open(db_opened);

function db_opened(err, conn) {
	if(err) throw err;

	conn.collection("Items", items_collection_opened);

	function items_collection_opened(err, coll) {
		if(err) throw err;
		
		coll.aggregate([
			{ $group: { _id: null, count: { $sum: 1 } } }
		], items_counted);
		
		function items_counted(err, res) {
			if(err) throw err;
		
			var totalItems = res[0].count;
			console.log(totalItems);
			
			var count = 0;
			var cursor = coll.find({}, {
				_id: true,
				feedId: true,
				title: true,
				body: true,
				guid: true,
				link: true,
				links: true,
				pubDate: true,
				thumbUrl: true,
				read: true
			}, { timeout: false, skip: count });
			
			var bulk = [];

			process_next();
			
			function process_next() {
				cursor.nextObject(item_available);
				
				function item_available(err, item) {
					if(err) throw err;
					
					if(item != null) {
						++count;
						//console.log(count + " read of " + totalItems + " - " + (100 * count / totalItems) + "%");
						
						try {
							if(item.read) {
								item.readBy = ["brisemec"];
							}
							
							item.id = item._id;
							delete item._id;
							delete item.read;

							var date = item.pubDate;
							var indexName = "feeds"; //-all" + date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
							bulk.push({ index: { _index: indexName, _type: "item", _id: item.id } });
							bulk.push(item);
						}
						catch(e) {
							console.log(e);
							delete item.body;
							console.log(item);
						}
					}
					
					if(item == null || bulk.length == 200) {
						
						esClient.bulk({ body: bulk }, items_indexed);
						bulk = [];
						
						function items_indexed(err) {
							if(err) throw err;
							
							console.log(count + " done of " + totalItems + " - " + (100 * count / totalItems) + "%");
							
							if(item != null) {
								process_next();
							}
						}
					} else {
						process_next();
					}
				}
			}
			
			/*
			
			cursor.each(function(err, item) {
				if(err) throw err;
			
				if(item == null) {
					console.log("Done");
					coll.close();
					conn.close();
					return;
				}
				
				var date = item.pubDate;
				var indexName = "feeds-" + date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
				
				if(item.read) {
					item.readBy = ["brisemec"];
				}
				
				item.id = item._id;
				delete item._id;
				delete item.read;
				
				esClient.index({
					index: indexName,
					type: "item",
					id: item.id,
					body: item
				}, function(err) {
					if(err) throw err;

					++count;
					console.log(count + "done of " + totalItems + " - " + (100 * count / totalItems) + "%");
				});
			});*/
		}
		/*
		var count = 0;
		
		var cursor = coll.find({});
		console.log(cursor);
		return;
		cursor.each(function(err, item) {
			if(err) throw err;
		
			if(item != null) {
				++count;
				console.log(item._id);
			} else {
				console.log(count);
			}
		});*/
	}
}
