var forms = require("forms"),
    fields = forms.fields,
    validators = forms.validators,
	widgets = forms.widgets;

var crudController = require("../bl/crudController"),
	handleError = crudController.handleError;

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

exports.registerRoutes = function(app, db) {
	var controller = crudController.create(db, "Feeds", "Feed", "name", function(cb) {
		cb(null, forms.create({
			name: fields.string({required: true}),
			pipeline: fields_object({required: true, widget: widgets.textarea()})
		}));
	});

	controller.poll = function(req, res) {

		var id = ObjectID.createFromHexString(req.params.id);
		controller.data.getOne(id, handleError(res, feed_retrieved));

		function feed_retrieved(feed) {

			pipeline.execute(feed.item.pipeline, pipeline_result_available);

			function pipeline_result_available(err, items) {
				if(err) return res.send(500, { error: err });

				

				//console.log(items);
				res.render("feeds/view", { title: feed.item.name, items: items });
			}
		}
	};

	controller.registerRoutes(app);

	// TODO: Should be post	
	app.get(controller.path + "/:id/poll", controller.poll);
};

