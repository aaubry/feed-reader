var page = require("webpage").create();
var system = require("system");

//var url = "http://calibre-ebook.com/new-in/ten";
//var url = "http://www.puredarwin.org/";
//var url = "http://blogs.wsj.com/digits/2013/08/25/starcraft-gameplay-boosts-mental-flexibility-says-study/?mod=WSJBlog";
//var url = "http://www.motherjones.com/politics/2013/08/mesh-internet-privacy-nsa-isp";

var url = system.args[1];
var selector = system.args[2];

page.settings.javascriptEnabled = true;
page.settings.loadImages = false;

//page.onConsoleMessage = function(msg) { console.log("console:", msg); };
page.onError = function(err) { /* Ignore errors */ }

page.open(url, page_loaded);

function page_loaded(status) {
	
	var html = page.evaluate(extract_main_content, selector);
	console.log(html);
	phantom.exit();

	function extract_main_content(selector) {
		try {
			remove_invalid_elements(document.body);
			if(selector != null) {
				var content = document.querySelector(selector);
				return content.outerHTML;
			}
			
			assign_ids(document.body, 0);

			var textNodes = [];
			find_text_nodes(document.body, textNodes);

			var textBlocks = find_parent_blocks(textNodes);
			dump_text_blocks(textBlocks);

			var currentBlockCount = textBlocks.length;
			for(var i = 0; i < 2; ++i) {
				textBlocks = aggregare_blocks(textBlocks);
				dump_text_blocks(textBlocks);

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

			return largestBlockElem.innerHTML;
		}
		catch(e) {
			console.log(e);
		}

		function remove_invalid_elements(node) {
			var style = window.getComputedStyle(node);

			var remove =
				style.display == "none"
				|| style.visibility == "hidden"
				|| node.tagName == "SCRIPT"
				|| node.tagName == "IFRAME"
				|| node.tagName == "OBJECT"
				|| node.tagName == "EMBED"
				|| node.className.indexOf("sharedaddy") >= 0;

			if(remove) {
				node.parentNode.removeChild(node);
				return;
			}

			var child = node.firstChild;
			while(child != null) {
				var next = child.nextSibling;
				switch(child.nodeType) {
					case Node.ELEMENT_NODE:
						remove_invalid_elements(child);
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

