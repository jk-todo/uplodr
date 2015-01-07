#!/usr/bin/env node

var formidable = require('formidable'),
    http = require('http'),
    util = require('util'),
    os = require('os'),
    fs = require('fs'),
    crypto = require('crypto'),
    uploadDir = os.tmpDir() + "/uplodr",
    config = require('./config.js');

if (typeof config.customUploadDir !== 'undefined')
  uploadDir = config.customUploadDir;

mkdirIfNotExist(uploadDir);

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // current date/time of session, use UTC to avoid DST
    var date = new Date();
    var dateString = '' + date.getUTCFullYear()
              + twoDigits(date.getUTCMonth()+1)
              + twoDigits(date.getUTCDate())
              + '-'
              + twoDigits(date.getUTCHours())
              + twoDigits(date.getUTCMinutes())
              + twoDigits(date.getUTCSeconds());
    var newUploadDir = uploadDir
                     + '/' + dateString
                     + '-' + randomCharacters(5);
    mkdirIfNotExist(newUploadDir);
    // parse a file upload
    var form = new formidable.IncomingForm();
    form.uploadDir = newUploadDir;
    form.parse(req, function(err, fields, files) {
      // metadata
      var metafile = newUploadDir + '/metadata-' + randomCharacters(5) + '.txt';
      fs.appendFile(metafile,
        util.inspect({fields: fields, files: files}),
        function(err){
          if (err) throw err;
        }
      );
      console.log('uplodr: new %s', metafile);
      // files.upload, "upload" is the name of the input field
      var originalList = new Array();
      originalList.push(processUpload(files.upload));
      originalList.push(processUpload(files.upload2));
      originalList.push(processUpload(files.upload3));
      originalList.push(processUpload(files.upload4));
      originalList.push(processUpload(files.upload5));
      // response to browser
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      // res.end(util.inspect({fields: fields, files: files}));
      res.end(cleanStringArray(originalList).join("\n"));
    });
    return;
  }

  // show a file upload form
  fs.readFile('./views/index.html', function(error, content) {
    if (error) {
      self.serverError(404, '404 Bad Request');
    } else {
      res.writeHead(200, {'content-type': 'text/html'});
      res.end(content, 'utf-8');
    }
  });
}).listen(80);

function cleanStringArray(orig) {
  var result = new Array();
  for (var i = 0; i < orig.length; i++) {
    if (orig[i].length > 0) {
      result.push(orig[i]);
      // console.log(orig[i]);
    }
  }
  return result;
}

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
  characters = characters
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
        var path = inputName.path.split('/');
        path.pop();
        var newUploadDir = path.join('/');
        // console.log('uplodr: newUploadDir %s', newUploadDir);
        if (String(extension).length > 0) { 
          var safename = newUploadDir + '/'
            + parts.join().match(/[a-zA-Z0-9]+/g).join('')
            + '.' + extension;
        } else {
          var safename = newUploadDir + '/'
            + parts.join().match(/[a-zA-Z0-9]+/g).join('');
        }
        fs.rename(inputName.path, safename, function(err){
          if (err) throw err;
        });
        return safename.split('/').pop();
      } else {
        return inputName.name;
      }
    } else {
      if (fs.existsSync(inputName.path)) {
        if (fs.statSync(inputName.path).isFile()) {
          fs.unlink(inputName.path, function(err){
            if (err) throw err;
          });
        }
      }
    }
  }
  return '';
}
