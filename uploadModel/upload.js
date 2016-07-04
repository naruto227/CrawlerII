/**
 * Created by deng on 16-6-7.
 */

var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
// var count = 0;
var mysql = require('mysql');
var config = require("../config.js");
var schedule = require('node-schedule');
var request = require("request");
var rule = new schedule.RecurrenceRule();
var conn = mysql.createConnection(config.db);
var page = 0;

exports.uploadServe = function (tablename) {
    var sql = 'SELECT * FROM ' + tablename;
    conn.query(sql, function (err, rows, fields) {
        if (err) {
            return console.log(err);
        }
        console.log(rows.length + "行数" + tablename);
        log(tablename, config.host + " end", rows.length);

    });

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
    // SELECT * FROM `sixrooms`where `room_name`!='0'and`room_name`!='' ORDER BY id desc limit 100  or nickname != 0 or owner_uid != 0 
    // var selectSql = 'SELECT * FROM ' + tablename + ' where room_name != ' + 0 + 'ORDER BY id desc limit ' + parseInt(page) * 100 + ', 100;';' WHERE room_name ' + '!=' + "" +
    var selectSql = 'SELECT * FROM ' + tablename +
        ' ORDER BY id desc limit ' + parseInt(page) * 100 + ', 100;';
    conn.query(selectSql, function (err, rows, fields) {
        if (err) {
            return console.log(err)
        }
        console.log(tablename + "上传json");
        if (rows.length == 0) {
            isFinish = true;
            myEvents.emit("clearTable", tablename);
            return;
        }
        var options = {
            headers: {"Connection": "close"},
            url: config.upload.uploadurl + tablename,
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
/**
 * 表清除
 */
myEvents.on("clearTable", function (tablename) {
    var selectSql = 'TRUNCATE TABLE ' + tablename;
    conn.query(selectSql, function (err, rows, fields) {
        if (err) {
            return console.log(err)
        }

    });
});
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

exports.log = function (platform, action, amount) {
    var url = "http://120.27.94.166:2999/log?platform=" + platform +
        "&action=" + action +
        "&amount=" + amount;
    request(url, function (error, response, body) {
            if (error) {
                return console.log(error);
            }
        }
    );
};

function log(platform, action, amount) {
    var url = "http://120.27.94.166:2999/log?platform=" + platform +
        "&action=" + action +
        "&amount=" + amount;
    request(url, function (error, response, body) {
            if (error) {
                return console.log(error);
            }
        }
    );
};