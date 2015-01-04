#!/usr/bin/env node

var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    os = require('os'),
    fs = require('fs'),
    uploadDir = os.tmpDir() + "/uplodr";

mkdirIfNotExist(uploadDir);

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = uploadDir;
    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });
    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(80);

function mkdirIfNotExist(dir) {
  fs.exists(dir, function(exists) {
    if (!exists) {
      fs.mkdirSync(dir);
    }
  });
  fs.exists(dir, function(exists) {
    if (!exists) {
      return false;
    } else {
      return fs.statSync(dir).isDirectory();
    }
  });
}
