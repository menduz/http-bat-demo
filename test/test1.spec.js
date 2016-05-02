// test1.spec.js
var bat = require('http-bat')();

var app = require('../app'); //express server

bat.load(__dirname + '/test1.bat.yml');

bat.run(app);