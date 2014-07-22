
/**
 * Module dependencies.
 */

var express = require("express")
  , http = require("http")
  , https = require("https")
  , path = require("path")
  , fs = require("fs")
  , bcrypt = require("bcrypt");

var expressLayouts = require("express-ejs-layouts");

var dbF = require("./bl/dbFactory");
var dbFactory = dbF.dbFactory;

dbF.initialize(database_initialized);

function launchServer(secure) {
	var app = express();

	// all environments
	app.set("views", __dirname + "/views");
	app.set("view engine", "ejs");
	app.use(expressLayouts);
	app.use(express.favicon());
	app.use(express.logger("dev"));

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

	require("./routes/home").registerRoutes(app, dbFactory);

	if(secure) {
		var options = {
			key: fs.readFileSync("ssl/key.pem"),
			ca: fs.readFileSync("ssl/csr.pem"),
			cert: fs.readFileSync("ssl/cert.pem")
		};

		https.createServer(options, app).listen(443, function(){
		  console.log("Express server listening on port 443");
		});
	} else {
		http.createServer(app).listen(80, function(){
			console.log("Express server listening on port 80");
		});
	}
}

function database_initialized(err) {
	if(err) throw err;

	launchServer(true);
	launchServer(false);
}
