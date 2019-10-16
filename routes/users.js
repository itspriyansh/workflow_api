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
      res.json({success: false, status: err});
    }else{
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Registration Successful!', token: auth.getToken({_id: user._id})});
    }
  });
});

router.put('/edit-profile', auth.verifyUser, (req,res,next) => {
  let updateObject={};
  if(req.body.firstname && req.body.firstname!="") updateObject.firstname=req.body.firstname;
  if(req.body.lastname && req.body.lastname!="") updateObject.lastname=req.body.lastname;
  if(req.body.usertype && req.body.usertype!="") updateObject.usertype=req.body.usertype;
  if(req.body.email && req.body.email!="") updateObject.username=req.body.email;
  User.findByIdAndUpdate(req.user._id, updateObject, {useFindAndModify: true, new: true})
  .populate('type').then(user => {
    if(req.body.oldPassword && req.body.oldPassword!="" && req.body.newPassword && req.body.newPassword!=""){
      req.user.changePassword(req.body.oldPassword, req.body.newPassword,(err,userAfterPassChange) => {
        if(err){
          res.statusCode=200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, user: user});
          return;
        }
        User.findById(userAfterPassChange._id).populate('type').then(user => {
          res.statusCode=200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, user: user});
        });
      });
    }else{
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, user: user});
    }
},(err) => {
    res.statusCode=500;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: false, error: err});
  });
});

router.put('/resetPassword', auth.verifyUser, (req,res,next) => {
  if(req.body.oldPassword && req.body.oldPassword!="" && req.body.newPassword && req.body.newPassword!=""){
    req.user.changePassword(req.body.oldPassword, req.body.newPassword,(err,userAfterPassChange) => {
      if(err){
        res.statusCode=500;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, err: err});
        return;
      }
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, message: "Password Changed Successfully..."});
    });
  }else{
    res.statusCode=500;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: false, err: new Error('Empty password fields!')});
  }
});

router.post('/adduser', auth.verifyUser, auth.verifyAction('admin'), (req, res) => {
  if(!req.body.lastname){
    req.body.lastname=''
  }
  User.register(new User({username: req.body.email, usertype: req.body.usertype, firstname: req.body.firstname, lastname: req.body.lastname}),
  req.body.password, (err, user) => {
    if(err){
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: err});
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
      User.findById(user._id).populate('type')
      .then((user) => {
        var token = auth.getToken({_id: user._id});
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: true, status: 'Login Successful!', token: token, user: user});
      },(err) => next(err)).catch((err) => next(err));
    });
  })(req, res, next);
});

router.get('/verify', auth.verifyUser, (req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({valid: true});
});

router.get('/list', auth.verifyUser, auth.verifyAction('admin'), (req,res,next) => {
  User.find()
  .populate('type')
  .then(users => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(users);
  }).catch(err => next(err));
});

router.route('/list/:userId').get(auth.verifyUser, auth.verifyAction('admin'), (req,res,next) => {
  User.findById(req.params.userId).populate('type').then(user => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
  }).catch(err => next(err));
}).put(auth.verifyUser, auth.verifyAction('admin'), (req,res,next) => {
  User.findByIdAndUpdate(req.params.userId, req.body, {new: true})
  .populate('type').then(user => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
  }).catch(err => next(err));
}).delete(auth.verifyUser, auth.verifyAction('admin'), (req,res,next) => {
  User.findByIdAndDelete(req.params.userId)
  .then(() => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true});
  }).catch(err => next(err));
});

module.exports = router;
