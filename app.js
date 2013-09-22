
/**
 * Module dependencies.
 */

var express = require("express")
  , feeds = require("./routes/feeds")
  , http = require("http")
  , path = require("path");

var expressLayouts = require("express-ejs-layouts");

var dbFactory = require("./bl/dbFactory").dbFactory;

var app = express();

// all environments
app.set("port", process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.favicon());
app.use(express.logger("dev"));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));

// development only
if ("development" == app.get("env")) {
  app.use(express.errorHandler());
}

//app.get("/", routes.index);
require("./routes/categories").registerRoutes(app, dbFactory);
require("./routes/feeds").registerRoutes(app, dbFactory);
require("./routes/items").registerRoutes(app, dbFactory);
require("./routes/home").registerRoutes(app, dbFactory);

http.createServer(app).listen(app.get("port"), function(){
  console.log("Express server listening on port " + app.get("port"));
});
