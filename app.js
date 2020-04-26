var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(36115, function () {
  console.log('Example app listening on port 36115!');
});