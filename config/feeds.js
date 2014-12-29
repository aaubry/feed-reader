var text = require("../bl/text");

/*
Feed item format:
{
	title: string,
	body: string,
	guid: string,
	data: object,
	link: url,
	links: [{
		title: string,
		link: url
	}],
	pubDate: string,
	thumbUrl: url,
	imageData: stream (not stored),
	imageUrl: url (not stored)
}
*/

function template_expresso(id, name, url) {
	return {
		id: id,
		name: name,
		icon: "http://expresso.sapo.pt/favicon.ico",
		configure: function(builder) {
			return builder
				.fetchFeed(url, "iso-8859-1")
				.map(function(i) {
					return {
						title: i.title,
						guid: i.link,
						link: i.link,
						pubDate: i.pubDate,
						imageUrl: i.image
					};
				})
				.excludeExisting()
				.fetchPages(null, null, "#artigo", "footer, .article-social, .authoring, h1")
				.selectImage()
				.map(function(i) {
					i.link = i.meta.baseUrl || i.link;
					return i;
				})
			;
		}
	};
}

exports.categories = [
	{	id: "bd",
		name: "BD",
		feeds: [
			{	id: "smbc",
				name: "Saturday Morning Breakfast Cereals",
				icon: "images/smbc.png",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/smbc-comics/PvLb?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.link,
								link: i.link,
								body: i.description
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "lewis",
				name: "Lewis Trondheim Projets",
				icon: "http://www.lewistrondheim.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchHtml("http://lewistrondheim.com/projets")
						.xpath(
							"//h:center//h:table//h:tr[position() > 1]",
							{
								coAuthor: "h:td[2]",
								editor: "h:td[5]",
								pages: "h:td[3]",
								pubDate: "h:td[4]",
								title: "h:td[1]"
							}
						)
						.map(function(i) {
							return {
								title: i.title,
								guid: text.format("{title}-{pages}-{pubDate}", i),
								link: "http://lewistrondheim.com/projets",
								body: text.format("<ul><li>{title}</li><li>{pages}</li><li>{pubDate}</li></ul>", i),
								thumbUrl: "http://lewistrondheim.com/images/siteproj.jpg"
							};
						})
						.excludeExisting();
				}
			},
			{	id: "lpr",
				name: "Les Petits Riens",
				icon: "http://www.lewistrondheim.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchHtml("http://lewistrondheim.com/blog/")
						.xpath(
							"//h:p[h:img[@rel]]",
							{
								title: "h:font",
								img: "h:img/@rel"
							}
						)
						.map(function(i) {
							return {
								title: i.title,
								guid: i.title,
								link: "http://lewistrondheim.com/blog/#message_" + i.title,
								body: text.format("<img src='http://lewistrondheim.com/blog/{img}' />", i),
								thumbUrl: "http://lewistrondheim.com/blog/" + i.img
							};
						})
						.excludeExisting();
				}
			},
			{	id: "xkcd",
				name: "XKCD",
				icon: "http://xkcd.com/s/919f27.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://xkcd.com/rss.xml")
						.map(function(i) {
							var image = /src\s*=\s*["']([^"']+)/.exec(i.description);
							var image = /src\s*=\s*["']([^"']+)/.exec(i.description);
						
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								pubDate: i.pubDate,
								body: i.description
									.replace(/["']\s*\/>/, "</p>")
									.replace(/alt\s*=\s*["']/, "/><p>")
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "cad",
				name: "Ctrl+Alt+Del",
				icon: "images/cad.png",
				configure: function(builder) {
					return builder
						.fetchFeed("http://cdn.cad-comic.com/rss.xml")
						.where(function(i) {
							return i.category == "Ctrl+Alt+Del";
						})
						.map(function(i) {
							return {
								title: i.title.replace("Ctrl+Alt+Del: ", ""),
								guid: i.guid,
								link: i.link,
								pubDate: i.pubDate,
								body: i.description
							};
						})
						.excludeExisting()
						.fetchPages(null, null, "#content > img")
						.selectImage();
				}
			},
			{	id: "samsam",
				name: "Ma vie est un enfer (de dessin) !!!",
				icon: "http://ddata.over-blog.com/xxxyyy/0/01/68/66/Autres/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://samsam.over-blog.com/rss-articles.xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								pubDate: i.pubDate,
								body: i.description.replace(/\/\d+x\d+\//, "/750x400/")
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "piratesourcil",
				name: "PirateSourcil",
				icon: "http://piratesourcil.blogspot.pt/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://piratesourcil.blogspot.com/feeds/posts/default?alt=rss")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								pubDate: i.pubDate,
								body: i.description
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "vdp",
				name: "Vida de Programador",
				icon: "http://piratesourcil.blogspot.pt/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/VidaDeProgramador?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								pubDate: i.pubDate,
								body: i.description
							};
						})
						.excludeExisting()
						.fetchPages(null, null, ".size-full")
						.selectImage();
				}
			},
			{	id: "oatmeal",
				name: "The Oatmeal",
				icon: "http://theoatmeal.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/oatmealfeed?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.link,
								link: i.link,
								pubDate: i["dc:date"],
								body: i.description
							};
						})
						.excludeExisting()
						.selectImage()
						.fetchPages(null, null, "#comic");
				}
			},
			{	id: "geekandpoke",
				name: "Geek&Poke",
				icon: "http://geek-and-poke.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/GeekAndPoke?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.link,
								link: i.link,
								pubDate: i["dc:date"],
								body: i.description
							};
						})
						.excludeExisting()
						.selectImage();
				}
			}
		]
	},
	{	id: "interesting",
		name: "Interesting",
		feeds: [
			{	id: "mmm",
				name: "Mr Money Mustache",
				icon: "http://www.mrmoneymustache.com/wp-content/uploads/2011/03/favicon1.jpg",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/MrMoneyMustache?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								body: i["content:encoded"],
								guid: i.guid,
								link: i.guid,
								links: [
									{ title: "Comments", link: i["wfw:commentRss"] }
								],
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "raptitude",
				name: "Raptitude",
				icon: "http://www.raptitude.com/wp-content/themes/raptitude-theme/custom/skins/Raptitude-Skin/img/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/Raptitudecom?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								body: i["content:encoded"],
								guid: i.guid,
								link: i.origLink,
								links: [
									{ title: "Comments", link: i["wfw:commentRss"] }
								],
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "codinghorror",
				name: "Coding Horror",
				icon: "http://www.codinghorror.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/codinghorror/")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								body: i.description,
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "so-yamldotnet",
				name: "StackOverflow YamlDotNet",
				icon: "http://cdn.sstatic.net/stackoverflow/img/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("http://stackoverflow.com/feeds/tag?tagnames=yamldotnet&sort=newest")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.id,
								link: i.id,
								body: i.summary,
								pubDate: i.published
							};
						})
						.excludeExisting();
				}
			},
			{	id: "rupeal",
				name: "Rupeal",
				icon: null,
				configure: function(builder) {
					return builder
						.fetchFeed("http://rupeal.tumblr.com/rss")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								body: i.description,
								pubDate: i.pubDate
							};
						})
						.excludeExisting();
				}
			},
			{	id: "jonskeet",
				name: "Jon Skeet's coding blog",
				icon: null,
				configure: function(builder) {
					return builder
						.fetchFeed("http://codeblog.jonskeet.uk/feed/")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								body: i.description,
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "nicklarsen",
				name: "Culture Of Development",
				icon: null,
				configure: function(builder) {
					return builder
						.fetchFeed("http://cultureofdevelopment.com/atom.xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.id,
								link: i.id,
								body: i.content,
								pubDate: i.updated
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "marcgravell",
				name: "Code, code and more code",
				icon: null,
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/CodeCodeAndMoreCode?format=xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.id,
								link: i["feedburner:origLink"],
								body: i.content,
								pubDate: i.published
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
			{	id: "ploeh",
				name: "ploeh blog",
				icon: null,
				configure: function(builder) {
					return builder
						.fetchFeed("http://blog.ploeh.dk/rss.xml")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.link,
								body: i.description,
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			},
		]
	},
	{	id: "hacking",
		name: "Hacking",
		feeds: [
			{	id: "hackaday",
				name: "Hack a Day",
				icon: "http://s1.wp.com/wp-content/themes/vip/hackaday2/images/favicon.ico?m=1353160633g",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds2.feedburner.com/hackaday/LgoM")
						.map(function(i) {
							return {
								title: i.title,
								body: i["content:encoded"],
								guid: i.guid,
								link: i["feedburner:origLink"],
								links: [
									{ title: "Comments", link: i.comments }
								],
								pubDate: i.pubDate
							};
						})
						.excludeExisting()
						.selectImage();
				}
			}
		]
	},
	{	id: "technews",
		name: "Tech News",
		feeds: [
			{	id: "hackernews",
				name: "Hacker News",
				icon: "https://news.ycombinator.com/favicon.ico",
				configure: function(builder) {
					return builder
						.fetchFeed("https://news.ycombinator.com/rss")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.comments,
								link: i.link,
								links: [
									{ title: "Comments", link: i.comments.replace("https://news.ycombinator.com/item?id=", "http://ihackernews.com/comments/") }
								]
							};
						})
						.excludeExisting()
						.fetchPages()
						.selectImage();
				}
			}
		]
	},
	{	id: "news",
		name: "News",
		feeds: [
			/*{	id: "publico",
				name: "Público",
				icon: "http://static.publico.pt/files/homepage/img/touch_icon_57x57.png",
				configure: function(builder) {
					return builder
						.fetchFeed("http://feeds.feedburner.com/PublicoRSS")
						.fetchPages(null, null, ".entry-content")
						.map(function(i) {
							return {
								title: i.title,
								guid: i.guid,
								link: i.meta.baseUrl || i.link,
								body: "<img src=\"" + i.meta["twitter:image"].replace('"', "&quot;") + "\" /><br/>" + i.body,
								pubDate: i.pubDate,
								imageUrl: i.meta["twitter:image"]
							};
						})
						//.excludeExisting()
					;
				}
			},*/
			
			template_expresso("expresso-politica", "Expresso - Política", "http://expresso.sapo.pt/static/rss/politica_25630.xml"),
			template_expresso("expresso-sociedade", "Expresso - Sociedade", "http://expresso.sapo.pt/static/rss/sociedade_25194.xml"),
			template_expresso("expresso-internacional", "Expresso - Internacional", "http://expresso.sapo.pt/static/rss/internacional_25629.xml"),
			template_expresso("expresso-economia", "Expresso - Economia", "http://expresso.sapo.pt/static/rss/economia_23413.xml"),
			template_expresso("expresso-cultura", "Expresso - Cultura", "http://expresso.sapo.pt/static/rss/cultura_25038.xml")
		]
	},
	{	id: "developer-misery",
		name: "Developer Misery",
		feeds: [
			{	id: "devreac",
				name: "Developer Reactions",
				icon: "http://38.media.tumblr.com/avatar_cbd9440e0f21_128.png",
				configure: function(builder) {
					return builder
						.fetchJson("http://developer-reactions.ruilopes.com", true)
						.repeat(50, function(bld, i) {
							bld
								.fetchJson(function(item) { return "http://developer-reactions.ruilopes.com" + item.results[item.results.length - 1].previousUrl; }, true);
						})
						.map(function(i) {
							return i.results;
						})
						.map(function(i) {
							var thumbUrl = null;
							if(i.poster) {
								i.poster.forEach(function(p) {
									if(thumbUrl == null || p.type == "jpeg") thumbUrl = p.url;
								});
							}
							
							var body = ['<video loop="loop" controls="controls" autoplay="autoplay" poster="', thumbUrl, '" style="width: 100%;">'];

							i.video.forEach(function(v) {
								body.push('<source src="', v.url, '" type="video/', v.type, '"></source>');
							});
							
							body.push('</video>');
							
							return {
								title: i.title,
								body: body.join(""),
								guid: "http://developer-reactions.ruilopes.com/reaction/" + i.id,
								link: "http://developer-reactions.ruilopes.com/reaction/" + i.id,
								thumbUrl: thumbUrl,
								links: [
									{ title: "Source", link: i.sourceUrl }
								]
							};
						})
						.excludeExisting();
				}
			}
		]
	}
];
