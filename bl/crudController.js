var crud = require("./crud");

var mongodb = require("mongodb"),
	ObjectID = mongodb.ObjectID;

var handleError = require("../bl/error").handleAppError;

exports.create = function(dbFactory, collection, title, sortField, createForm) {
	var result = {};

	var path = "/" + collection.toLowerCase().substr(0, collection.length - 1);
	result.path = path;

	var data = crud.create(dbFactory, collection);
	result.data = data;

	result.list = function(req, res) {
		data.getPage({}, req.query.page, sortField, handleError(res, function(r) {
			createForm(handleError(res, function(form) { 
				res.render("crud/list", {
					title: title + "s",
					pages: r.pages,
					items: r.items,
					form: form,
					path: path
				});
			}));
		}));
	};

	result.confirmRemove = function(req, res) {
		res.render("crud/delete", {
			title: "Delete " + title
		});
	};

	result.remove = function(req, res) {
		var id = ObjectID.createFromHexString(req.params.id);
		data.removeOne(id, handleError(res, function() {
			res.redirect(path);
		}));
	};

	result.edit = function(req, res) {
		createForm(handleError(res, function(form) {
			form.handle(req, {
				success: function(f) {
					var id = ObjectID.createFromHexString(req.params.id);
					data.updateOne(id, f.data, handleError(res, function() {
						res.redirect(path);
					}));
				},
				error: function(f) {
					res.render("crud/edit", {
						title: "Edit " + title,
						id: req.params.id,
						form: f
					});
				},
				empty: function(f) {
					var id = ObjectID.createFromHexString(req.params.id);
					data.getOne(id, handleError(res, function(r) {
						res.render("crud/edit", {
							title: "Edit " + title,
							id: req.params.id,
							form: f.bind(r.item)
						});
					}));
				}
			});
		}));
	};

	result.create = function(req, res) {
		createForm(handleError(res, function(form) {
			var render = function(f) {
				res.render("crud/edit", {
					title: "Create " + title,
					id: null,
					form: f
				});
			};

			form.handle(req, {
				success: function(f) {
					data.insert(f.data, handleError(res, function() {
						res.redirect(path);
					}));
				},
				error: render,
				empty: render
			});
		}));
	};

	result.registerRoutes = function(app) {
		app.get(path, this.list);
		app.get(path + "/create", this.create);
		app.post(path + "/create", this.create);
		app.get(path + "/:id", this.edit);
		app.post(path + "/:id", this.edit);
		app.get(path + "/:id/delete", this.confirmRemove);
		app.post(path + "/:id/delete", this.remove);
	};

	return result;
};
