/**
 * Created by huang on 16-6-11.
 */
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var count = 0;
var mysql = require('mysql');
var config = require("../config.js");
var schedule = require('node-schedule');
var request = require("request");
var rule = new schedule.RecurrenceRule();
var conn = mysql.createConnection(config.db);
var page = 0;

exports.uploadServe = function (tablename) {
    if (page == 0) {
        sub(tablename);
    }
};
var isFinish = false;
myEvents.on('upload', function (tablename) {
    var times = [];
    for (var i = 0; i < 60; i = i + 5) {
        times.push(i);
    }

    rule.second = times;
    schedule.scheduleJob(rule, function () {
        if (isFinish) {
            page = 0;
            isFinish = false;
            this.cancel();
        } else {
            selectAndSend(tablename);
        }
    });
});
function selectAndSend(tablename) {
    var selectSql = 'SELECT * FROM ' + tablename +
        ' ORDER BY id desc limit ' + parseInt(page) * 100 + ', 100;';
    conn.query(selectSql, function (err, rows, fields) {
        if (err) {
            return console.log(err)
        }
        console.log(rows);
        if (rows.length == 0) {
            isFinish = true;
            return;
        }
        var options = {
            headers: {"Connection": "close"},
            url: 'http://121.42.136.52:2999/'+tablename,
            method: 'POST',
            json: true,
            body: {data: rows}
        };

        function callback(error, response, data) {
            if (!error && response.statusCode == 200) {
                console.log('----info------', data);

            }
        }

        request(options, callback);
    });
    page++;
};
var mypretime = 0;
function sub(tablename) {
    var Today = new Date();
    var NowHour = Today.getHours();
    var NowMinute = Today.getMinutes();
    var NowSecond = Today.getSeconds();
    var mysec = (NowHour * 3600) + (NowMinute * 60) + NowSecond;
    if ((mysec - mypretime) > 10) {
//10只是一个时间值，就是10秒内禁止重复提交，值随便设
        mypretime = mysec;
    } else {
        return;
    }
    myEvents.emit('upload', tablename);
}