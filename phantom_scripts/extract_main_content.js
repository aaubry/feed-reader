var page = require("webpage").create();
var system = require("system");

//var url = "http://calibre-ebook.com/new-in/ten";
//var url = "http://www.puredarwin.org/";
//var url = "http://blogs.wsj.com/digits/2013/08/25/starcraft-gameplay-boosts-mental-flexibility-says-study/?mod=WSJBlog";
//var url = "http://www.motherjones.com/politics/2013/08/mesh-internet-privacy-nsa-isp";

var quiet = false;
var i = 1;
if(system.args[i] == "-q") {
	quiet = true;
	++i;
}

var url = system.args[i++];
var selector = system.args[i++];
var exclusions = system.args[i++];

page.settings.javascriptEnabled = true;
page.settings.loadImages = false;
page.settings.userAgent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36";

if(!quiet) {
	page.onConsoleMessage = function(msg) { console.log("console:", msg); };
	page.onError = function(err) {
		console.log(err);
	}
} else {
	page.onError = function(err) {
		/* Ignore errors */
	}
}

page.open(url, page_loaded);

function page_loaded(status) {
	
	var pageData = page.evaluate(extract_main_content, selector, exclusions);
	console.log(pageData);
	phantom.exit();

	function extract_main_content(selector, exclusions) {
	
		try {
			
			if(exclusions) {
				var nodes = document.querySelectorAll(exclusions);
				for(var i = 0; i < nodes.length; ++i) {
					nodes[i].parentNode.removeChild(nodes[i]);
				}
			}
			
			var body = null;
			
			if(selector != null) {
				var content = document.querySelector(selector);
				if(content != null) {
					cleanup(content, false);
					body = content.outerHTML;
				}
			}
			
			if(body == null) {
				cleanup(document.body, true);
			
				assign_ids(document.body, 0);

				var textNodes = [];
				find_text_nodes(document.body, textNodes);

				var textBlocks = find_parent_blocks(textNodes);
				//dump_text_blocks(textBlocks);

				var currentBlockCount = textBlocks.length;
				for(var i = 0; i < 2; ++i) {
					textBlocks = aggregare_blocks(textBlocks);
					//dump_text_blocks(textBlocks);

					if(currentBlockCount == textBlocks.length) break;
					currentBlockCount = textBlocks.length;
				}

				var largestBlockElem = document.body;
				var largestBlockLength = 0;

				textBlocks.forEach(function(b) {
					var length = b.texts.reduce(function(l, t) {
						return l + t.nodeValue.length;
					}, 0);

					if(length > largestBlockLength) {
						largestBlockElem = b.elem;
						largestBlockLength = length;
					}
				});
				
				body = largestBlockElem.innerHTML;
			}
			
			var metaTags = document.querySelectorAll("head meta[name]");
			var meta = {
				baseUrl: window.location.toString(),
				title: document.title
			};
			
			Array.prototype.forEach.call(metaTags, function(m) {
				meta[m.name] = m.content;
			});
			
			var data = {
				meta: meta,
				body: body
			};
			
			return JSON.stringify(data);
		}
		catch(e) {
			console.log(e);
		}

		function cleanup(node, removeHidden) {
			var style = window.getComputedStyle(node);

			var remove =
				(removeHidden && (style.display == "none" || style.visibility == "hidden"))
				|| node.tagName == "SCRIPT"
				|| node.tagName == "IFRAME"
				|| node.tagName == "OBJECT"
				|| node.tagName == "EMBED"
				|| node.className.indexOf("sharedaddy") >= 0;

			if(remove) {
				node.parentNode.removeChild(node);
				return;
			}
			
			if(node.tagName == "IMG") {
				// Ensure that all images have absolute uris
				node.setAttribute("src", node.src);
			}
			
			["style", "class", "width", "height", "color", "border"].forEach(function(n) {
				node.removeAttribute(n);
			});

			var child = node.firstChild;
			while(child != null) {
				var next = child.nextSibling;
				switch(child.nodeType) {
					case Node.ELEMENT_NODE:
						cleanup(child, removeHidden);
						break;
				}

				child = next;
			}
		}

		function assign_ids(node, nextId) {
			node["__id"] = nextId.toString();
			++nextId;

			var child = node.firstChild;
			while(child != null) {
				switch(child.nodeType) {
					case Node.ELEMENT_NODE:
						nextId = assign_ids(child, nextId);
						break;
				}

				child = child.nextSibling;
			}
			return nextId;
		}

		function find_text_nodes(node, results) {
			var whitespacePattern = /^\s*$/;

			var child = node.firstChild;
			while(child != null) {
				switch(child.nodeType) {
					case Node.ELEMENT_NODE:
						find_text_nodes(child, results);
						break;

					case Node.TEXT_NODE:
						if(!whitespacePattern.test(child.nodeValue)) {
							results.push(child);
						}
						break;
				}

				child = child.nextSibling;
			}
		}

		function find_parent_blocks(textNodes) {
			var result = [];
			var blocksByParentId = {};

			textNodes.forEach(function(textNode) {
				var parentElement = textNode.parentNode;
				while(parentElement != null && parentElement.nodeType == Node.ELEMENT_NODE) {

					switch(parentElement.tagName) {
						case "SCRIPT":
						case "A":
							return;

						case "PRE":
						case "DIV":
						case "P":
						case "UL":
						case "OL":
						case "DL":
						case "TABLE":
							var id = parentElement["__id"];
							if(blocksByParentId[id] == null) {
								var block = { elem: parentElement, texts: [] };
								blocksByParentId[id] = block;
								result.push(block);
							}
							blocksByParentId[id].texts.push(textNode);
							return;
					}

					parentElement = parentElement.parentNode;
				}
			});

			return result;
		}

		function aggregare_blocks(textBlocks) {
			var result = [];
			var blocksByParentId = {};

			textBlocks.forEach(function(block) {

				var parent = block.elem.tagName != "BODY"
					? block.elem.parentNode
					: block.elem;

				var id = block.elem.parentNode["__id"];
				var otherBlock = blocksByParentId[id];
				if(otherBlock == null) {
					blocksByParentId[id] = block;
					result.push(block);
				} else {
					otherBlock.elem = parent;
					otherBlock.texts = otherBlock.texts.concat(block.texts);
				}
			});

			return result;
		}

		function dump_text_blocks(textBlocks) {
			console.log(textBlocks.map(function(b) {
				return "\n" + b.elem["__id"] + "\t" + b.elem.tagName + ":\t" + b.texts.length;
			}));
		}
	}
}

