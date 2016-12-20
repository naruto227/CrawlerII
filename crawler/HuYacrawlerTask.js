/**
 * Created by deng on 16-6-7.
 */
var request = require('request');
var mysql = require('mysql');
var cheerio = require("cheerio");
var config = require("../config.js");
var conn = mysql.createConnection(config.db);
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var isFinish = false;
var isMainFinish = false;
var start = 1;
var page = 1;
/**
 * @return {boolean}
 */
exports.UpdateTags = function () {
    if (isFinish) {
        isFinish = false;
        start = 1;
        return true;
    } else {
        var limit_range = (start - 1) * 10 + ',' + 10;
        var userAddSql = 'SELECT * FROM huya limit ' + limit_range + ';';
        conn.query(userAddSql, function (err, rows, fields) {   //rows是啥？
            if (err) throw err;
            if (rows.length == 0) {
                isFinish = true;
                return;
            }
            for (var i = 0; i < rows.length; i++) {
                myEvents.emit('geted', rows[i].room_id);
            }
        });
        start++;
        return false;
    }
};
myEvents.on('geted', function (room_id) {
    var optionsfordetail = {
        method: 'GET',
        encoding: null,
        url: "http://www.huya.com/" + room_id
    };
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var $ = cheerio.load(body);  //cheerio解析data
                var tags = '';
                var fans = $('#activityCount').toArray()["0"].children["0"].data;//$('.host-name')["0"].attribs.title
                myEvents.emit('updateFans', fans, room_id);
            } catch (e) {
                console.log(e)
            }
        }
    });
});
myEvents.on('updateFans', function (fans, room_id) {
    var updateSql = 'UPDATE huya SET fans = ? WHERE room_id = ?';
    var updateParams = [fans, room_id];
    conn.query(updateSql, updateParams, function (err, result) {
        if (err) {
            return console.log(err);
        }
    })
});

exports.getMainData = function () {
    myEvents.emit('initData', page);
    page++;
    if (isMainFinish) {
        isMainFinish = false;
        return true;
    } else {
        return false;
    }
};
myEvents.on('initData', function (pn) {
    var huyaApi = {
        method: 'GET',
        encoding: null,
        url: "http://www.huya.com/index.php?m=Live&do=ajaxAllLiveByPage&page=" + pn
    };
    request(huyaApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        try {
            var data = JSON.parse(String(body));
            if (data.data.list.length == 0) {
                isMainFinish = true;
                page=1;
                return;
            }
            acquireData(data);

        }catch (e){
            console.log(e.message);
        }

    })

});
function acquireData(data) {
    var sql = 'replace INTO huya (room_id, room_name, owner_uid, nickname, online, game_name, fans,tags,face) VALUES ?';
    if (data.data.list.length == 0) {
        return console.log('没有数据了');
    }
    var values = [];
    data.data.list.forEach(function (item) {
        var params = [item.privateHost, item.roomName, 0, item.nick, item.totalCount, item.gameFullName, 0, item.recommendTagName, item.avatar180];
        values.push(params);
    });
    conn.query(sql, [values], function (err, result) {
        if (err) {
            return console.log(err);
        }
    });
}