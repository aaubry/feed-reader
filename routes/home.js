var emailClient = require("emailjs/email");

var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var error = require("../bl/error"),
	handleAppError = error.handleAppError,
	closeOnError = error.closeOnError;

var config = require("../config/config");

var https = require("https");

var request = require("request");

exports.registerRoutes = function(app, esClient) {

	app.get("/robots.txt", robots);
	
	app.get("/", categories);
	app.get("/search", search);
	app.post("/_slack", slack);
	app.post("/unread", unread);
	app.post("/share", share);
	//app.post("/_slackcmd", slackcmd);
	app.get("/:id", list);
	app.get("/i/:id", view);
	
	function categories(req, res) {
		
		var categoryItems = config.getAllCategories().map(function(cat) {
			return {
				id: cat.id,
				name: cat.name,
				feeds: cat.feeds,
				unread: -1
			};
		});
		
		if(req.user != null) {
			var remaining = categoryItems.length;
			categoryItems.forEach(function(category) {
				
				var feedIds = category.feeds.map(function(feed) { return feed.id; });
				
				esClient.search({
					index: "feeds",
					searchType: "count",
					body: {
						query: {
							filtered: {
								filter: {
									and: [
										{
											terms: {
												feedId: feedIds
											}
										},
										{
											not: {
												filter: {
													term: {
														readBy: req.user
													}
												}
											}
										}
									]
								}
							}
						}
					}
				}, handleAppError(res, search_complete));
				   
				function search_complete(response) {
					console.log({ queryTook: response.took, feedIds: feedIds.join(", ") });
					
					category.unread = response.hits.total;
					
					if(--remaining == 0) {
						res.render("home/categories", {
							title: "Categories",
							items: categoryItems,
							query: req.query.q,
							feeds: null,
							meta: null,
							base: null
						});
					}
				}					
			});
		} else {
			res.render("home/categories", {
				title: "Categories",
				items: categoryItems,
				query: req.query.q,
				feeds: null,
				meta: null,
				base: null
			});
		}
	}

	function search(req, res) {

		var filteredQuery = {};
		
		var queryText = req.query.q;
		var queryFeed = req.query.f;
		
		if(queryText) {
			filteredQuery.query = {
				match: {
					_all: {
						query: queryText,
						fuzziness: "AUTO"
					}
				}
			};
		}
		
		if(queryFeed) {
			filteredQuery.filter = {
				terms: {
					feedId: queryFeed.split(',')
				}
			};
		}
		
		esClient.search({
			index: "feeds",
			_source: [ "id", "feedId", "title", "thumbUrl" ],
			body: {
				size: 150,
				query: {
					filtered: filteredQuery
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log({ queryTook: response.took });
			
			res.render("home/list", {
				title: "Feed Items",
				items: response.hits.hits.map(function(i) { return i._source }),
				category: {
					name: "Search Results"
				},
				query: queryText,
				feeds: queryFeed,
				unread: null,
				meta: null,
				base: null
			});
		}
	}
	
	function list(req, res) {

		var categoryId = req.params.id;
		var category = config.getCategoryById(categoryId);
		var feedIds = category.feeds.map(function(feed) { return feed.id; });

		var filter = {
			terms: {
				feedId: feedIds
			}
		};
		
		if(!req.query.unread && req.user != null) {
			filter = {
				and: [
					filter,
					{
						not: {
							filter: {
								term: {
									readBy: req.user
								}
							}
						}
					}
				]
			};
		}
	
		esClient.search({
			index: "feeds",
			_source: [ "id", "feedId", "title", "thumbUrl", "readBy" ],
			sort: [ "pubDate:desc" ],
			body: {
				size: 150,
				query: {
					filtered: {
						filter: filter
					}
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log({ queryTook: response.took });
			
			res.render("home/list", {
				title: "Feed Items",
				items: response.hits.hits.map(function(i) {
					i._source.read = req.user && i._source.readBy && i._source.readBy.indexOf(req.user) >= 0;
					return i._source;
				}),
				category: category,
				query: req.query.q,
				feeds: feedIds.join(','),
				unread: req.query.unread || false,
				meta: null,
				base: null
			});			
		}
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
			console.log({ queryTook: response.took });

			var item = response.hits.hits[0]._source;
			
			// Mark as read
			if(req.user != null) {
				esClient.update({
					index: "feeds",
					type: "item",
					id: item.id,
					body: {
						script: 'if(ctx._source.readBy.contains(user)) { ctx.op = "none" } else { ctx._source.readBy += user }',
						params: {
							user: req.user
						}
					}
				}, function(err, r) {
					if(err) console.log(r);
				});
			}
			
			var feed = config.getFeedById(item.feedId);
			var category = config.getCategoryByFeedId(item.feedId);

			var thumbUrl = item.thumbUrl;
			if(thumbUrl && thumbUrl[0] == "/") {
				thumbUrl = "http://feed.iron.aaubry.net" + thumbUrl;
			}
			
			res.setHeader("Cache-Control", "public, max-age=" + (60 * 60 * 24));
			
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
						url: "http://feed.iron.aaubry.net/i/" + item.id,
						site_name: feed.name,
						image: thumbUrl
					},
					article: {
						publisher: item.link,
						section: "TODO"
					},
					twitter: {
						card: "summary_large_image",
						site: feed.name,
						domain: feed.name,
						"image:src": thumbUrl
					}
				},
				base: item.link,
				category: category
			});
		}
	}

	function unread(req, res) {
	
		// Mark as read
		if(req.user != null) {
			esClient.update({
				index: "feeds",
				type: "item",
				id: req.body.id,
				body: {
					script: 'if(!ctx._source.readBy.contains(user)) { ctx.op = "none" } else { ctx._source.readBy -= user }',
					params: {
						user: req.user
					}
				}
			}, handleAppError(res, update_complete));
		} else {
			res.status(404).send("Not found");
		}
		
		function update_complete() {
			esClient.indices.flush({
				index: "feeds"
			}, handleAppError(res, flush_complete));
		
			function flush_complete() {
				var category = config.getCategoryByFeedId(req.body.feedId);
				res.redirect("/" + category.id);
			}
		}
	}
	
	/*
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
					}*//*
					
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
	}*/

	function share(req, res) {
		esClient.search({
			index: "feeds",
			body: {
				size: 1,
				query: {
					filtered: {
						filter: {
							term: {
								id: req.body.id
							}
						}
					}
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log({ queryTook: response.took });

			var item = response.hits.hits[0]._source;
			
			var feed = config.getFeedById(item.feedId);
			var category = config.getCategoryByFeedId(item.feedId);

			var server = emailClient.server.connect({
				user: config.email.username, 
				password: config.email.password, 
				host: config.email.smtp, 
				ssl: false
			});
			
			var url = "http://feed.iron.aaubry.net/i/" + item.id;
			
			var thumbUrl = item.thumbUrl;
			if(thumbUrl[0] == "/") {
				thumbUrl = "http://feed.iron.aaubry.net" + thumbUrl;
			}
			console.log(thumbUrl);

			var message = {
				from: config.email.username, 
				to: req.body.email,
				subject: item.title,
				text: url,
				attachment: [
					{ data: "<html><img src='" + thumbUrl + "' /><br/><a href='" + url + "'>" + url + "</a></html>", alternative: true }
				]
			};

			server.send(message, handleAppError(res, message_sent));
			
			function message_sent(message) {
				res.send("Shared to " + req.body.email);
			}

			/*
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
						url: "http://feed.iron.aaubry.net/i/" + item.id,
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
				},
				base: item.link,
				category: category
			});*/
		}		
	}
	
	function slack(req, res) {
		
		var feedId = req.body.trigger_word;
		
		var query = null;
		
		var queryText = req.body.text.substr(req.body.trigger_word.length + 1);
		if(queryText.length > 0) {
			query = {
				match: {
					_all: {
						query: queryText,
						fuzziness: "AUTO"
					}
				}
			};
		}
		
		esClient.search({
			index: "feeds",
			_source: [ "id", "link", "title", "thumbUrl", "body" ],
			body: {
				size: feedId != "vdm" ? 20 : 100,
				query: {
					filtered: {
						query: query,
						filter: {
							term: {
								feedId: feedId
							}
						}
					}
				}
			}
		}, handleAppError(res, search_complete));
           
		function search_complete(response) {
			console.log({ queryTook: response.took });
			
			if(response.hits.total == 0) {
				res.send({ text: "not found :'("});
				return;
			}
			
			var itemIndex = Math.floor(Math.random() * response.hits.hits.length);
			var item = response.hits.hits[itemIndex]._source;

			res.set("Content-Type", "application/json");
			
			if(feedId == "vdm") {
				var queryUrl = "http://api.mymemory.translated.net/get?de=aaubry%40gmail.com&langpair=fr|en&q=" + encodeURIComponent(item.body);
				
				request(queryUrl, function(err, response, body) {
					var translationData = JSON.parse(body);
					
					var data = {
						username: item.title,
						text: translationData.responseData.translatedText
					};
				
					res.json(data);
				});
				
				return;
			}
			
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
				text: "<" + item.link + "|" + item.title + ">" + thumbUrl,
				mrkdwn: true,
				unfurl_links: true,
				unfurl_media: true
			};
			
			res.json(data);
		}
	}

	function robots(req, res) {
		res.send("User-agent: *\nDisallow: /");
	}
};

