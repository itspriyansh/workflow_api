var express = require('express');
var router = express.Router();
var auth = require('../authenticate');
var User = require('../models/users');
var passport = require('passport');

/* GET users listing. */
router.get('/', auth.verifyUser, function(req, res) {
  User.findById(req.user._id).populate('type')
  .then((user) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
  },(err) => next(err)).catch((err) => next(err));
});

router.post('/signup', (req, res) => {
  if(!req.body.lastname){
    req.body.lastname=''
  }
  User.register(new User({username: req.body.email, usertype: req.body.usertype, firstname: req.body.firstname, lastname: req.body.lastname}),
  req.body.password, (err, user) => {
    if(err){
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json(err);
    }else{
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Registration Successful!', token: auth.getToken({_id: user._id})});
    }
  });
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if(err) return next(err);
    if(!user){
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
      return;
    }
    req.logIn(user, (err) => {
      if(err){
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});
        return;
      }
      var token = auth.getToken({_id: user._id});
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Successful!', token: token});
    });
  })(req, res, next);
});

router.get('/verify', auth.verifyUser, (req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({valid: true});
});

module.exports = router;
