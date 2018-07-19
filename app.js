var express = require('express');
    createError = require('http-errors'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    cors = require('cors'),
    eventLogger = require('./lib/event_logger'),
    helmet = require('helmet'),
    fs = require('fs'),
    app = express();

var i_Router = require('./routes/index'),
    s_Route = require('./routes/sms'),
    m_Route = require('./routes/mail'),
    l_Route = require('./routes/logging');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.disable('x-powered-by');
app.use(eventLogger());
// app.use(logger('common', {
//   stream: fs.createWriteStream('./logs/express.log', {flags: 'a'})
// }));
app.use(logger('dev'))
app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1', i_Router);
app.use('/v1/sms', s_Route);
app.use('/v1/mail', m_Route);
app.use('/v1/logs', l_Route);


app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
