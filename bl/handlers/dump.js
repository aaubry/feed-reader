
exports.builder = function(projection) {
	return {
		name: "Dump",
		weight: 1,
		handler: function(item, args, context, cb) {
			try {
				var maxStringLength = 180;
			
				var itemCopy = {};
				for(var k in item) {
					var value = item[k];
					if(typeof value == "string" && value.length > maxStringLength) {
						value = value.substr(0, maxStringLength) + " ... [" + value.length + "]";
					}
					itemCopy[k] = value;
				}
				console.log(itemCopy);
				
				cb(null, item);
			} catch(err) { return cb(err); }
		}
	};
};
