var page = require("webpage").create();
var system = require("system");

var url = system.args[1];
var width = parseInt(system.args[2]);
var height = parseInt(system.args[3]);

page.onConsoleMessage = function(msg) { console.log("console:", msg); };
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

			for(var i = 0; i < imgs.length; ++i) {
				var img = imgs[i];
				
				if(img.offsetWidth >= width * 0.8 && img.offsetHeight >= height * 0.8) {
					var size = img.offsetWidth * img.offsetHeight;
					if(size > bestImageSize) {
						bestImage = img;
						bestImageSize = size;
					}
				}
			}
			
			if(bestImageSize <= 0) {
				return "";
			}

			var canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			
			var scalingX = width / bestImage.offsetWidth;
			var scalingY = height / bestImage.offsetHeight;
			
			var scaling;
			if(scalingX < scalingY) {
				var ratio = scalingX / scalingY;
				scaling = ratio < 0.8 ? scalingX : scalingY;
			} else {
				var ratio = scalingY / scalingX;
				scaling = ratio < 0.8 ? scalingY : scalingX;
			}
			
			var imageWidth = Math.round(bestImage.offsetWidth * scaling);
			var imageHeight = Math.round(bestImage.offsetHeight * scaling);
	
			var context = canvas.getContext("2d");
			var cx = (width - imageWidth) / 2;
			var cy = (height - imageHeight) / 2;
			
			context.drawImage(bestImage, cx, cy, imageWidth, imageHeight);

			if(imageWidth < width || imageHeight < height) { 
				var pixels = context.getImageData(cx, cy, 1, 1);
				var bg = "rgba("
					+ pixels.data[0]
					+ ", " + pixels.data[1]
					+ ", " + pixels.data[2]
					+ ", " + pixels.data[3] / 255
					+ ")";
					
				context.fillStyle = bg;
				context.fillRect(0, 0, width, height);
				
				context.drawImage(bestImage, cx, cy, imageWidth, imageHeight);
			}
			
			var dataUrl = canvas.toDataURL("image/png");
			var data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
			return data;
		}
		catch(e) {
			console.log(e);
		}
	}
}

