var phantom = require("./bl/phantom");
var crypto = require("crypto");
var fs = require("fs");

phantom.execute("select_best_image.js", "http://www.codinghorror.com/blog/2013/08/the-code-keyboard.html", "100", "100", image_extracted);

function image_extracted(err, imageData) {
	var buffer = new Buffer(imageData, "base64");
	
	var stream = fs.createWriteStream("tmp/temp.png");
	stream.end(buffer, null, image_written);
	
	function image_written(err) {
		if(err) return console.error(err);
		
		console.log("done");
	}
}

