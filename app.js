var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var schedule = require('node-schedule');
var request = require('request');
var rule = new schedule.RecurrenceRule();
var times = [];

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
rule.minute = times;
for (var i = 0; i < 60; i = i + 20) {
    times.push(i);
}
var count = 0;
var options = {
    method: 'GET',
    encoding: null,
    url: "localhost:3000"
};
schedule.scheduleJob(rule, function () {

    switch (count % 5) {
        case 0:
            options.url = 'http://localhost:3000/huajiao';
            break;
        case 1:
            options.url = 'http://localhost:3000/ingkee';
            break;
        case 2:
            options.url = 'http://localhost:3000/longzhu';
            break;
        case 3:
            options.url = 'http://localhost:3000/sixrooms';
            break;

        case 4:
            options.url = 'http://localhost:3000/laifeng';
            break;

        default:
            break;
    }
    request(options, function (err, response, body) {
        if (err) {
            console.log(err.message);
            return;
        }
    });
    count++;
    if (count % 100 == 0) {
        console.log(count);
        count = 0;
    }
});


module.exports = app;
