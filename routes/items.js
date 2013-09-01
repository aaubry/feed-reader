var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crudController = require("../bl/crudController"),
	handleError = crudController.handleError;

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

exports.registerRoutes = function(app, db) {
	var controller = crudController.create(db, "Items", "Item", "pubDate", function(cb) {
		cb(null, forms.create({
			//name: fields.string({required: true}),
			//pipeline: fields_object({required: true, widget: widgets.textarea()})
		}));
	});

	controller.registerRoutes(app);
};

