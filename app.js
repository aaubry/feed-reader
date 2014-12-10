var express = require("express")
  , http = require("http")
  , https = require("https")
  , path = require("path")
  , fs = require("fs")
  , bcrypt = require("bcrypt");
  
/*
var logFile = fs.createWriteStream("/var/log/feed-site.log", { flags: "a" });
process.__defineGetter__("stdout", function() { return logFile; });
process.__defineGetter__("stderr", function() { return logFile; });
*/

var expressLayouts = require("express-ejs-layouts");

var elasticsearch = require("elasticsearch");
var secureServer = launchServer(true);
var insecureServer = launchServer(false);

process.on('SIGTERM', function () {
	console.log("Stopping HTTPS server");
	secureServer.close(function () {
		console.log("Stopping HTTP server");
		insecureServer.close(function () {
			console.log("Exiting");
			// Disconnect from cluster master
			process.disconnect && process.disconnect();
		});
	});
});

function launchServer(secure) {
	var app = express();

	// all environments
	app.set("views", __dirname + "/views");
	app.set("view engine", "ejs");
	app.use(expressLayouts);
	app.use(express.favicon());
	app.use(express.logger());
	app.use(express.urlencoded()); // to support URL-encoded bodies
	//app.use(express.logger({ stream: logFile }));

	if(secure) {
		var protectedPassword = "$2a$10$qermVMgGvGiiCLw3lqFGaecyuGTwmjtsl.JmCWQSKlUpFRRLQURWu";
		var validPassword = null;
		app.use(express.basicAuth(function(user, pass) {
			if(user !== "brisemec") return false;
			if(validPassword != null) {
				return validPassword === pass;
			}
			
			var result = bcrypt.compareSync(pass, protectedPassword);
			if(result) validPassword = pass;
			return result ? user : null;
		}));
	}
	
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, "public")));

	// development only
	if ("development" == app.get("env")) {
	  app.use(express.errorHandler());
	}

	var esClient = elasticsearch.Client({ host: "localhost:9200" });
	require("./routes/home").registerRoutes(app, esClient);

	function dropPrivileges() {
		// Check if we are running as root
		if (process.getgid() === 0) {
			process.setgid("nogroup");
			process.setuid("nobody");
		}
	}

	if(secure) {
		var options = {
			key: fs.readFileSync(path.join(__dirname, "ssl/key.pem")),
			ca: fs.readFileSync(path.join(__dirname, "ssl/csr.pem")),
			cert: fs.readFileSync(path.join(__dirname, "ssl/cert.pem"))
		};

		return https.createServer(options, app).listen(443, function(){
			console.log("Express server listening on port 443");
			dropPrivileges();
		});
	} else {
		return http.createServer(app).listen(8080, function(){
			console.log("Express server listening on port 8080");
			dropPrivileges();
		});
	}
}
