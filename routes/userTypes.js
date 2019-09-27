var UserType = require('../models//userTypes');
var express = require('express');
var bodyParser = require('body-parser');
var auth = require('../authenticate');
var async = require('async');

var router = express.Router();
router.use(bodyParser.json());

router.get('/', (req, res, next) => {
  UserType.find().then(types => {
    found = [false,false,false,false];
    types.forEach(type => {
      if(type.name=='User Operator') found[0]=true;
      else if(type.name=='Data Entry') found[1]=true;
      else if(type.name=='Review') found[2]=true;
      else if(type.name=='GB') found[3]=true;
    });
    if(!found[0]){
      UserType.create({
          name: 'User Operator',
          location_enable: true,
          location_view: true,
          comments: true,
          file_access: true,
          download: true
      });
    }if(!found[1]){
      UserType.create({
          name: 'Data Entry',
          location_enable: true,
          upload: true,
          file_access: true,
          chat: true
      });
    }if(!found[2]){
      UserType.create({
          name: 'Review',
          location_enable: true,
          location_view: true,
          upload: true,
          comments: true,
          data_entry: true,
          file_access: true,
          offer_details: true
      });
    }if(!found[3]){
      UserType.create({
          name: 'GB',
          location_view: true,
          comments: true,
          file_access: true,
          offer_details: true
      });
    }
    return;
  }).then(() => UserType.find())
  .then(types => {
    UserType.find().then((types) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(types);
    })
  }).catch((err) => next(err));
});
router.put('/', auth.verifyUser, auth.verifyAction('upload'), (req,res,next) => {
  async.eachSeries(req.body.usertypes, function updateObject(type,done) {
    UserType.findOneAndUpdate({name: type.name},type,done);
  }, function allDone(err){
    res.statusCode = 200;
    res.setHeader('Content-Type','application/json');
    res.json({});
  });
});
module.exports = router;
