var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('./config');
var mongoose = require('mongoose');
var passport = require('passport');
var cors = require('cors');
const filemanagerMiddleware = require('@opuscapita/filemanager-server').middleware;
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userTypesRouter = require('./routes/userTypes');
var projectsRouter = require('./routes/projects');
var resolvePath = require('./routes/resolvePath');

mongoose.connect(config.mongoUrl).then(() => {
  console.log('Database Connection established!');
},(err) => {
  console.log(err);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(cors());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/usertypes', userTypesRouter);
app.use('/projects', projectsRouter);
app.use('/files', filemanagerMiddleware({
  fsRoot: path.resolve(__dirname, './data'),
  rootName: 'Root'
}));
app.use('/resolve', resolvePath);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
