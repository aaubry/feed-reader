var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

var crudController = require("../bl/crudController");

exports.registerRoutes = function(app, dbFactory) {
	var controller = crudController.create(dbFactory, "Categories", "Category", "name", function(cb) {
		cb(null, forms.create({
			name: fields.string({required: true})
		}));
	}, "/categories");

	controller.registerRoutes(app);
};


