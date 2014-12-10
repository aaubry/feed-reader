var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var error = require("../bl/error"),
	handleAppError = error.handleAppError,
	closeOnError = error.closeOnError;

var config = require("../config/config");

var https = require("https");

exports.registerRoutes = function(app, esClient) {

	app.get("/robots.txt", robots);
	
	app.get("/", categories);
	app.get("/search", search);
	app.post("/_slack", slack);
	app.post("/_slackcmd", slackcmd);
	app.get("/:id", list);
	app.get("/i/:id", view);
	
	function categories(req, res) {
		
		var categoryItems = config.getAllCategories().map(function(cat) {
			return {
				id: cat.id,
				name: cat.name,
				feeds: cat.feeds,
				unread: 0
			};
		});
		
			/*	var remaining = categoryItems.length;
				
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
								feeds: null,
								meta: null
							});
						}
					}
				});
			}*/
		
		res.render("home/categories", {
			title: "Categories",
			items: categoryItems,
			query: req.query.q,
			feeds: null,
			meta: null
		});		
	}

	function search(req, res) {

		var db = esClient();
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
				
				var query = {};
				
				if(queryText) {
					query["$text"] = { $search: queryText };
				}
				
				if(queryFeed) {
					query.feedId = { $in: queryFeed.split(',') };
				}
				
				coll.find(query, fields, options).sort({ score: { $meta: "textScore" } }, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					if(req.user == null) items.forEach(function(i) { i.read = false; });
					
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: {
							name: "Search Results"
						},
						query: queryText,
						feeds: queryFeed,
						unread: null,
						meta: null
					});
				}
			}
		}
	}
	
	function list(req, res) {

		var categoryId = req.params.id;
		var category = config.getCategoryById(categoryId);
		var feedIds = category.feeds.map(function(feed) { return feed.id; });

		/* TODO
		if(!req.query.unread && req.user != null) {
			filter.read = false;
		} */
	
		esClient.search({
			index: "feeds",
			_source: [ "id", "feedId", "title", "thumbUrl" ],
			sort: [ "pubDate" ],
			body: {
				size: 150,
				query: {
					filtered: {
						filter: {
							terms: {
								feedId: feedIds
							}
						}
					}
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log(response.took);
			
			res.render("home/list", {
				title: "Feed Items",
				items: response.hits.hits.map(function(i) { return i._source }),
				category: category,
				query: req.query.q,
				feeds: feedIds.join(','),
				unread: req.query.unread || false,
				meta: null
			});			
		}
		
		/*
	
	
		var db = esClient();
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
					if(req.user == null) items.forEach(function(i) { i.read = false; });
					
					res.render("home/list", {
						title: "Feed Items",
						items: items,
						category: category,
						query: req.query.q,
						feeds: feedIds.join(','),
						unread: req.query.unread || false,
						meta: null
					});
				}
			}
		}*/
	}

	function view(req, res) {
	
		esClient.search({
			index: "feeds",
			body: {
				size: 1,
				query: {
					filtered: {
						filter: {
							term: {
								id: req.params.id
							}
						}
					}
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log(response.took);
			
			var item = response.hits.hits[0]._source;
			var feed = config.getFeedById(item.feedId);
			
			res.render("home/view", {
				title: item.title,
				item: item,
				query: req.query.q,
				feeds: item.feedId,
				meta: {
					og: {
						locale:"en_US",
						type: "article",
						title: item.title,
						description: item.title,
						url: "http://feed.iron.aaubry.net/i/" + item._id,
						site_name: feed.name,
						image: item.thumbUrl
					},
					article: {
						publisher: item.link,
						section: "TODO"
					},
					twitter: {
						card: "summary_large_image",
						site: feed.name,
						domain: feed.name,
						"image:src": item.thumbUrl
					}
				}
			});
		}
	
	
/*	
		var db = esClient();
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
					feedId: true,
					thumbUrl: true
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
					
					var feed = config.getFeedById(item.feedId);
					
					res.render("home/view", {
						title: item.title,
						item: item,
						query: req.query.q,
						feeds: item.feedId,
						meta: {
							og: {
								locale:"en_US",
								type: "article",
								title: item.title,
								description: item.title,
								url: "http://feed.iron.aaubry.net/i/" + item._id,
								site_name: feed.name,
								image: item.thumbUrl
							},
							article: {
								publisher: item.link,
								section: "TODO"
							},
							twitter: {
								card: "summary_large_image",
								site: feed.name,
								domain: feed.name,
								"image:src": item.thumbUrl
							}
						}
					});
					
					function item_marked_as_read(err) {
						if(err) console.log(err);
					}
				}
			}
		}*/
	}
	
	function postOnSlack(data) {
		var postData = JSON.stringify(data);
		var post = https.request({
			host: "hooks.slack.com",
			port: "443",
			path: "/services/T02PSNSEB/B02RARBRS/aB6oArncl5oMKu2AcawrRgNL",
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": postData.length
			}
		}, function(res) {
			res.on("data", function (chunk) {
				console.log("Response: " + chunk);
			});
		});
		
		post.write(postData);
		post.end();
	}
	
	function slackcmd(req, res) {
		var db = esClient();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, items_collection_opened)));

			function items_collection_opened(coll) {
				var options = {
					limit: 20
				};

				var fields = {
					title: true,
					thumbUrl: true,
					link: true
				};
				
				var feedId = req.body.command.substr(1);
				var feed = config.getFeedById(feedId);

				var filter = { feedId: feedId };
				var sorting = { pubDate: -1 };

				var queryText = req.body.text;
				if(queryText.length > 0) {
					filter["$text"] = { $search: queryText };
					fields.score = { $meta: "textScore" };
					sorting = { score: { $meta: "textScore" } };
				}
				
				coll.find(filter, fields, options).sort(sorting, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					if(items.length == 0) {
						res.send("not found :'(");
						return;
					}
					
					var itemIndex = Math.floor(Math.random() * items.length);
					var item = items[itemIndex];
					
					var thumbUrl = "";
					//var useThumb = ["devreac", "vdp", "oatmeal"].indexOf(feedId) >= 0;
					/*var useThumb = ["devreac"].indexOf(feedId) >= 0;
					if(useThumb) {
						thumbUrl = item.thumbUrl;
						if(thumbUrl[0] == "/") {
							thumbUrl = "http://feed.iron.aaubry.net" + thumbUrl;
						}
					
						postOnSlack({
							username: feed.name,
							channel: req.body.channel_id,
							text: "<" + thumbUrl + "|->"
						});
					}*/
					
					postOnSlack({
						username: feed.name,
						channel: req.body.channel_id,
						text: "<" + item.link + "|" + item.title + ">",
						unfurl_links: true,
						unfurl_media: true
					});
					
					res.send("");
				}
			}
		}
	}
	
	function slack(req, res) {
		var db = esClient();
		db.open(closeOnError(db, handleAppError(res, db_opened)));

		function db_opened(conn) {
			conn.collection("Items", closeOnError(db, handleAppError(res, items_collection_opened)));

			function items_collection_opened(coll) {
				var options = {
					limit: 20
				};

				var fields = {
					title: true,
					thumbUrl: true,
					link: true
				};
				
				var feedId = req.body.trigger_word;
				var filter = { feedId: feedId };
				var sorting = { pubDate: -1 };

				var queryText = req.body.text.substr(req.body.trigger_word.length + 1);
				if(queryText.length > 0) {
					filter["$text"] = { $search: queryText };
					fields.score = { $meta: "textScore" };
					sorting = { score: { $meta: "textScore" } };
				}
				
				coll.find(filter, fields, options).sort(sorting, closeOnError(db, handleAppError(res, items_sorted)));

				function items_sorted(cursor) {
					cursor.toArray(closeOnError(db, cursor, handleAppError(res, items_retrieved)));
				}

				function items_retrieved(items) {
					if(items.length == 0) {
						res.send({ text: "not found :'("});
						return;
					}
					
					var itemIndex = Math.floor(Math.random() * items.length);
					var item = items[itemIndex];
					
					var thumbUrl = "";
					var useThumb = ["devreac", "vdp", "oatmeal"].indexOf(feedId) >= 0;
					if(useThumb) {
						thumbUrl = item.thumbUrl;
						if(thumbUrl[0] == "/") {
							thumbUrl = "http://feed.iron.aaubry.net" + thumbUrl;
						}
					
						thumbUrl = " <" + thumbUrl + "|->";
					}
					
					var data = {
						//text: item.title,
						text: "<" + item.link + "|" + item.title + ">" + thumbUrl,
						//text: item.link,
						//text: "<" + "http://feed.iron.aaubry.net/i/" + item._id + "|" + item.title + ">",
						//text: "http://feed.iron.aaubry.net/i/" + item._id,
						mrkdwn: true,
						unfurl_links: true,
						unfurl_media: true/*,
						attachments: [
							{
								"fallback": "http://feed.iron.aaubry.net/i/" + item._id,
								"text": "http://feed.iron.aaubry.net/i/" + item._id
							}
						]*/
					};
					
					/*data = {
						text: "http://feed.iron.aaubry.net/i/" + item._id
					};*/
					
					console.log(data);
					
					res.set("Content-Type", "application/json");
					res.json(data);
				}
			}
		}
	}

	function robots(req, res) {
		res.send("User-agent: *\nDisallow: /");
	}
};

