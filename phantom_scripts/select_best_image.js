var page = require("webpage").create();
var system = require("system");

var url = system.args[1];
var width = parseInt(system.args[2]);
var height = parseInt(system.args[3]);

//page.onConsoleMessage = function(msg) { console.log("console:", msg); };
page.onError = function(err) { /* Ignore errors */ }

page.settings.javascriptEnabled = true;
page.settings.loadImages = true;
page.open(url, page_loaded);

function page_loaded(status) {

	var data = page.evaluate(select_best_image, width, height);
	console.log(data);
	phantom.exit();

	function select_best_image(width, height) {
		try {
			var imgs = document.getElementsByTagName("img");

			var bestImage = { src: "" };
			var bestImageSize = 0;
			var weight = 1;

			for(var i = 0; i < imgs.length; ++i) {
				var img = imgs[i];
				
				if(img.offsetWidth >= width * 0.8 && img.offsetHeight >= height * 0.8) {
					var size = weight * img.offsetWidth * img.offsetHeight;
					if(size > bestImageSize) {
						bestImage = img;
						bestImageSize = size;
					}
					
					weight = weight * 0.9;
				}
			}
			
			var url = null;
			if(bestImageSize > 0) {
				url = bestImage.src;
			}
			
			return JSON.stringify({ url: url })
		}
		catch(e) {
			console.log(e);
		}
	}
}

