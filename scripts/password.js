var bcrypt = require("bcrypt");

var password = bcrypt.genSaltSync();
password = password.substr(password.length - 10);

var salt = bcrypt.genSaltSync();
var hash = bcrypt.hashSync(password, salt);

console.log("password:", password);
console.log("hash:", hash);

console.log("test:", bcrypt.compareSync(password, hash));
