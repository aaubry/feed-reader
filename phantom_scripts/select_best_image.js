var page = require("webpage").create();
var system = require("system");

var url = system.args[1];

// page.onConsoleMessage = function(msg) { console.log("console:", msg); };

page.settings.javascriptEnabled = true;
page.settings.loadImages = true;
page.open(url, page_loaded);

function page_loaded(status) {

	var url = page.evaluate(select_best_image);
	console.log(url);
	phantom.exit();

	function select_best_image() {
		try {
			var imgs = document.getElementsByTagName("img");

			var largestImage = { src: "" };
			var largestImageSize = 0;

			for(var i = 0; i < imgs.length; ++i) {
				var img = imgs[i];

				var size = img.offsetWidth * img.offsetHeight;
				if(size > largestImageSize) {
					largestImage = img;
					largestImageSize = size;
				}
			}

			return largestImage.src
		}
		catch(e) {
			console.log(e);
		}
	}
}

