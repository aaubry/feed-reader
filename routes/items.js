var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crudController = require("../bl/crudController");
var handleAppError = require("../bl/error").handleAppError;

var crud = require("../bl/crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

exports.registerRoutes = function(app, dbFactory) {
	var controller = crudController.create(dbFactory, "Items", "Item", "pubDate", function(cb) {
		cb(null, forms.create({
			feedId: fields.string({required: true}),
			title: fields.string({required: true}),
			body: fields.string({required: true, widget: widgets.textarea()}),
			guid: fields.string({required: true}),
			link: fields.string({required: true}),
			pubDate: fields.string({required: true}),
			thumbUrl: fields.string({required: false})
		}));
	});
	
	controller.parseId = function(id) { return id; };
	
	controller.registerRoutes(app);
}
