var express = require('express');
var auth = require('../authenticate');
var fs = require('fs');

var router = express.Router();

router.post('/', auth.verifyUser, (req, res) => {
  let pathArr = req.body.path.split('/');
  let pathStr = __dirname.slice(0,-7);
  pathArr.forEach(p => {
    pathStr = pathStr+'/'+p;
    if(!fs.existsSync(pathStr)){
      fs.mkdirSync(pathStr);
    }
  });
  res.statusCode=200;
  res.setHeader('Content-Type', 'application/json');
  res.json({});
});

module.exports = router;
