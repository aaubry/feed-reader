
exports.forEach = function(items, action, cb) {
	
	var idx = 0;
	process_next_item(null, null);
	
	function process_next_item(err, data) {
		if(err) return cb(err);
		if(idx >= items.length) return cb(null, data);

		action(items[idx++], process_next_item);
	}
};

exports.map = function(items, projection, cb) {

	var remaining = items.length;
	var results = new Array(items.length);

	for(var i = 0; i < items.length; ++i) {
		map_item(i);
	}

	function map_item(idx) {
		projection(items[idx], idx, current_item_mapped);

		function current_item_mapped(err, data) {
			if(err) return cb(err);

			results[idx] = data;
			if(--remaining == 0) cb(null, results);
		}
	}
};

