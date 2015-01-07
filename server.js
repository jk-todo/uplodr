#!/usr/bin/env node

var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    os = require('os'),
    fs = require('fs'),
    crypto = require('crypto'),
    uploadDir = os.tmpDir() + "/uplodr",
    config = require('./config.js');

if (typeof config.customUploadDir !== 'undefined') \
  uploadDir = config.customUploadDir;

mkdirIfNotExist(uploadDir);

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // current date/time of session, use UTC to avoid DST
    var date = new Date();
    var dateString = '' + date.getUTCFullYear() \
              + twoDigits(date.getUTCMonth()+1) \
              + twoDigits(date.getUTCDate()) \
              + '-' \
              + twoDigits(date.getUTCHours()) \
              + twoDigits(date.getUTCMinutes()) \
              + twoDigits(date.getUTCSeconds());
    var newUploadDir = uploadDir \
                     + '/' + dateString \
                     + '-' + randomCharacters(5);
    mkdirIfNotExist(newUploadDir);
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = newUploadDir;
    form.parse(req, function(err, fields, files) {
      // metadata
      fs.appendFile(newUploadDir + 'metadata.txt',
        util.inspect({fields: fields, files: files}),
        function(err){
          if (err) throw err;
        }
      );
      console.log('uplodr: new %s', metafile);
      // files.upload, "upload" is the name of the input field
      processUpload(files.upload);
      processUpload(files.upload2);
      processUpload(files.upload3);
      processUpload(files.upload4);
      processUpload(files.upload5);
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
    '<input type="file" name="upload2"><br>'+
    '<input type="file" name="upload3"><br>'+
    '<input type="file" name="upload4"><br>'+
    '<input type="file" name="upload5"><br>'+
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

function randomCharacters (count, characters) {
  characters = characters \
    || "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = new Array(count),
      randomByte = crypto.randomBytes(count);
  for (var i = 0; i < count; i++) {
    result[i] = characters[randomByte[i] % characters.length]
  };
  return result.join('');
}

function processUpload(inputName) {
  if (typeof inputName !== 'undefined') {
    if (inputName.size !== 0) {
      if (inputName.name.lastIndexOf('.') > 0) {
        var parts = inputName.name.split('.');
        var extension = parts.pop();
        var newUploadDir = inputName.name.split('/');
        newUploadDir.pop();
        if (String(extension).length > 0) { 
          var safename = newUploadDir + '/' \
            + parts.join().match(/[a-zA-Z0-9]+/g).join().replace(/,/g,'') \
            + '.' + extension;
        } else {
          var safename = newUploadDir + '/' \
            + parts.join().match(/[a-zA-Z0-9]+/g).join().replace(/,/g,'');
        }
        fs.rename(inputName.path, safename, function(err){
          if (err) throw err;
        });
      }
      return true;
    }
  }
  return false;
}
