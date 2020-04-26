var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello Big World!');
});

app.listen(process.env.PORT, function () {
  console.log('Example app listening on port 36115!');
});