var fs = require('fs')
var qs = require('querystring')
var join = require('path').join
var bodyParser = require('body-parser')
var busboy = require('connect-busboy')
var express = require('express')

var app = module.exports = express()
var port = process.env.PORT || 4567


/**
 * Respond with "Success".
 */
function successHandler(req, res) {
  return res.send('Success')
}

/**
 * Respond with the "id" uri parameter.
 */
function idParamHandler(req, res) {
  return res.send(req.params.id)
}

/**
 * Enable CORS.
 */
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')

  return next()
})

/**
 * Respond to the root resource.
 */
app.all('/', successHandler)

/**
 * Bounce the status code and body back to the user.
 */
app.all('/status/:status(\\d+)', function (req, res) {
  res.statusCode = Number(req.params.status)

  return res.send('Success')
})

/**
 * Say hello!
 */
app.all('/hello', function (req, res) {
  return res.send('Hello ' + (req.query.name || 'World') + '!')
})

/**
 * Stream a file back to the user.
 */
app.all('/stream', function (req, res) {
  return fs.createReadStream(join(__dirname, 'test/lorem.txt')).pipe(res)
})

/**
 * Bounce post body
 */
app.post('/post-body/json', bodyParser.json(), function (req, res) {
  res.json(req.body);
});
app.post('/post-body/attach-file', busboy(), function (req, res) {
  var files = [];
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var responseFile = {};

    responseFile[fieldname] = filename;
    files.push(responseFile);
    file.resume();
  });
  req.busboy.on('finish', function () {
    res.send(files);
  });
  req.pipe(req.busboy)
});
app.post('/post-body/url', bodyParser.urlencoded({ extended: true }), function (req, res) {
  res.json(req.body);
});
app.post('/post-body/form', busboy(), function (req, res) {
  var files = [];
  req.busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    var responseFile = {};

    responseFile[fieldname] = val;
    files.push(responseFile);
  });
  req.busboy.on('finish', function () {
    res.send(files);
  });
  req.pipe(req.busboy)
});
app.post('/post-body/form-n-files', busboy(), function (req, res) {
  var files = [];
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    var responseFile = {};

    responseFile[fieldname] = filename;
    files.push(responseFile);
    file.resume();
  });
  req.busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    var responseFile = {};

    responseFile[fieldname] = val;
    files.push(responseFile);
  });
  req.busboy.on('finish', function () {
    res.send(files);
  });
  req.pipe(req.busboy)
});
/**
 * Create a bounce router, whose purpose is to give requests back to the user.
 */
var bounce = new express.Router()
  .all('/url', function (req, res) {
    return res.send(req.originalUrl)
  })
  .all('/body', function (req, res) {
    if (req.headers['content-type']) {
      res.setHeader('Content-Type', req.headers['content-type'])
    }

    return req.pipe(res)
  })
  .all('/query', function (req, res) {
    return res.send(req.query)
  })
  .all('/headers', function (req, res) {
    res.header(
      'Access-Control-Allow-Headers',
      'Authorization, X-Default-Header, X-Custom-Header'
    )

    return res.send(req.headers)
  })
  .all('/parameter/:id?', idParamHandler)

/**
 * Use the bouncers for the bounce and defaults routes.
 */
app.use(['/bounce', '/defaults'], bounce)

/**
 * Respond with the request uri parameter.
 */
app.all('/parameters/single/:id', idParamHandler)
app.all('/parameters/prefix/one:id', idParamHandler)
app.all('/parameters/prefix/three:id', idParamHandler)

/**
 * Respond with success.
 */
app.all('/extensions/static.json', successHandler)
app.all('/extensions/media-type/enum.:ext(json|xml)', successHandler)
app.all('/extensions/media-type/enum-period.:ext(json|xml)', successHandler)
app.all('/extensions/media-type/basic.:ext', successHandler)

/**
 * RAML conflict uris.
 */
app.all('/conflicts/media-type.json', successHandler)
app.all('/conflicts/media-type/route', successHandler)

/**
 * Respond with basic text.
 */
app.all('/responses/text', function (req, res) {
  return res.send('text')
})

/**
 * Respond with JSON.
 */
app.all('/responses/json', function (req, res) {
  return res.send({ json: true })
})


var accessToken = "accessToken_" + parseInt(Math.random() * 100000);

app.post('/get_access_token', function (req, res) {
  return res.send({ new_token: accessToken })
});

app.get('/secured_by_token', function (req, res) {
  if (req.query.accessToken != accessToken) {
    return res.status(401).send(req.query).end();
  } else {
    return res.send({ success: true })
  }
});

app.get('/secured_by_token/header', function (req, res) {
  if (req.headers.authorization != accessToken) {
    return res.status(401).send(req.headers).end();
  } else {
    return res.send({ success: true })
  }
});

/**
 * Respond to url encoded endpoint.
 */
app.all('/responses/url-encoded/basic', function (req, res) {
  res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

  return res.send('key=value')
})

/**
 * Respond to url encoded endpoint.
 */
app.all('/responses/url-encoded/duplicate', function (req, res) {
  res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

  return res.send('key=1&key=2&key=3')
})

/**
 * Respond to url encoded endpoint.
 */
app.all('/responses/url-encoded/escaped', function (req, res) {
  res.setHeader('Content-Type', 'application/x-www-form-urlencoded')

  return res.send(qs.stringify({ key: 'Hello, world!' }))
})


var users = [
  { id: 0, name: "Agustin" },
  { id: 1, name: "Nicolas" }
]

app.get('/users', function (req, res) {
  return res.json(users);
})

app.get('/users/:id', function (req, res) {
  var user = users[req.params.id];

  if (user)
    return res.json(user);

  return res.status(404);
});



/**
 * Listen to a port if the module wasn't required.
 */
if (!module.parent) {
  app.listen(port, function () {
    console.log('Express running at http://localhost:' + port)
  })
}
