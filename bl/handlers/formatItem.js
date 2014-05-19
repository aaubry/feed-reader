var crypto = require("crypto");

exports.builder = function() {
	return {
		name: "Format item",
		weight: 1,
		handler: function(item, args, context, cb) {
			try  {
				var pubDate	= new Date(item.pubDate);
				if(!(pubDate.valueOf() > 0)) pubDate = new Date();

				var itemId = crypto.createHash("md5").update(item.guid).digest("hex");
				var feedItem = {
					_id: itemId,
					feedId: context.feedId,

					title: item.title,
					body: item.body,
					guid: item.guid,
					link: item.link,
					links: item.links,
					pubDate: pubDate,
					thumbUrl: item.thumbUrl,
					imageData: item.imageData,
					read: false
				};
				cb(null, feedItem);
			} catch(err) { cb(err); }
		}
	};
};
