var express = require('express')

var app = module.exports = express()
var port = process.env.PORT || 4567

app.get('/', function (req, res) {
  return res.send('Success')
});

/**
 * Say hello!
 */
app.all('/hello', function (req, res) {
  return res.send('Hello ' + (req.query.name || 'World') + '!')
})











/**
 * Listen to a port if the module wasn't required.
 */
if (!module.parent) {
  app.listen(port, function () {
    console.log('Express running at http://localhost:' + port)
  })
}
