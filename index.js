const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();
const https = require("https");
const fs = require('node:fs');

app.locals.moment = require('moment');
app.set('view engine','ejs');

app.use(function (req, res,next) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-access-token');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use('/api/v1/login', require('./apronline/login.js'));
app.use('/api/v1/typedoc', require('./apronline/typedoc.js'));
app.use('/api/v1/template', require('./apronline/template.js'));
app.use('/api/v1/pdf', require('./apronline/pdf.js'));
app.use('/api/v1/gentemplate', require('./apronline/gentemplate.js'));
app.use('/api/v1/image', require('./apronline/image.js'));
app.use('/api/v1/uploadfile', require('./apronline/uploadfile.js'));
app.use('/api/v1/approve', require('./apronline/approve.js'));
app.use('/api/v1/datadoc', require('./apronline/datadoc.js'));
app.use('/api/v1/memo', require('./apronline/memo.js'));
app.use('/api/v1/dataapr', require('./apronline/dataapr.js'));
app.use('/api/v1/noaprdoc', require('./apronline/noaprdoc.js'));
app.use('/api/v1/rejectaprdoc', require('./apronline/rejectaprdoc.js'));
app.use('/api/v1/detaildoc', require('./apronline/detaildoc.js'));
app.use('/api/v1/line', require('./apronline/line.js'));
app.use('/api/v1/line2', require('./line.js'));
// const options = {
//   key: fs.readFileSync("key.pem"),
//   cert: fs.readFileSync("cert.pem"),
// };

const server = app.listen(3006, function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log('Running ... http://localhost%s', host, port);
});

// https.createServer(options, app)
// .listen(3006, function (req, res) {
//   console.log("Server started at port 3000");
// });