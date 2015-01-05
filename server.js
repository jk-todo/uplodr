#!/usr/bin/env node

var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    os = require('os'),
    fs = require('fs'),
    uploadDir = os.tmpDir() + "/uplodr",
    config = require('./config.js');

if (typeof config.customUploadDir !== 'undefined') uploadDir = config.customUploadDir;

mkdirIfNotExist(uploadDir);

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // current date/time of session
    var date = new Date();
    var dateString = '' + date.getFullYear() + twoDigits(date.getMonth()+1) + twoDigits(date.getDate()) + '-' + twoDigits(date.getHours()) + twoDigits(date.getMinutes()) + twoDigits(date.getSeconds()) + '-' + date.getTimezoneOffset();
    var newUploadDir = uploadDir + '/' + dateString;
    mkdirIfNotExist(newUploadDir);
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = newUploadDir;
    form.parse(req, function(err, fields, files) {
      if (typeof files.upload !== 'undefined') {
        if (files.upload.size !== 0) {
          // metafile, files.upload, "upload" is the name of the input field
          var metafile = files.upload.path + '.txt';
          fs.appendFile(metafile, util.inspect({fields: fields, files: files}), function(err){
            if (err) throw err;
          });
        }
      }
      // response to browser
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload.\n\n');
      // res.end(util.inspect({fields: fields, files: files}));
      res.end();
    });
    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(80);

function mkdirIfNotExist(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  if (!fs.existsSync(dir)) {
    return false;
  } else {
    return fs.statSync(dir).isDirectory();
  }
}

function twoDigits(num) {
  if (Number(num) < 10) {
    return '0' + Number(num);
  } else {
    return num;
  }
}
