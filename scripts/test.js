var request = require("request");
var spawn = require("child_process").spawn;

//var convert = spawn("identify", [ "-" ]);
var convert = spawn("convert", [ "-resize", "100x100^", "-gravity", "center", "-crop", "100x100+0+0", "+repage", "-", "/home/aaubry/work/feed/crop.png" ]);

convert.stdout.on('data', function (data) {
	console.log('OUT: ' + data);
});

convert.stderr.on('data', function (data) {
	console.log('ERR: ' + data);
});

request("http://imagens0.publico.pt/imagens.aspx/890890?tp=UH&db=IMAGENS").pipe(convert.stdin);
