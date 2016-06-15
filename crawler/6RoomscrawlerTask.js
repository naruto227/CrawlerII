/**
 * Created by huangzq on 16-06-11
 */
var request = require('request'),
    mysql = require('mysql'),
    cheerio = require('cheerio'),
    config = require("../config.js"),
    conn = mysql.createConnection(config.db),
    EventEmitter = require('events').EventEmitter;

var myEvents = new EventEmitter();
var isFinish = false;
var isMainFinish = false;
var start = 1;
//var page = 0;
/**
 * @return{boolean}
 */

exports.getMainData = function () {
    myEvents.emit('initData');
    //page++;
    if (isMainFinish) {
        isMainFinish = false;
        return true;
    } else {
        return false;
    }
};

myEvents.on('initData', function () {
    var sixroomsApi = {
        method: 'GET',
        encoding: null,
        url: "http://www.6.cn/liveAjax.html"
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(sixroomsApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        /** @namespace data.roomList */
        if (data.roomList.length == 0) {
            isMainFinish = true;
            return;
        }
        acquireData(data);
    })
});
function acquireData(data) {
    var sql = 'replace INTO sixrooms (room_id, room_name, owner_uid, nickname, online, fans, face) VALUES (?,?,?,?,?,?,?)';
    if (data.roomList.length == 0) {
        return console.log('没有数据了');
    }
    data.roomList.forEach(function (item) {
        /** @namespace item.rtype */
        var params = [item.rid, item.username, item.uid, item.rtype, item.count, 0, item.pic];
        conn.query(sql, params, function (err, result) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

exports.updateFans = function () {
    var limit_range = (start - 1) * 10 + ',' + 10;
    var sql = 'SELECT * FROM sixrooms limit ' + limit_range + ';';
    conn.query(sql, function (err, rows) {
        if (err) {
            console.log(err);
        }
        if (rows.length > 0) {
            start++;
            for (var i = 0; i < rows.length; i++) {
                myEvents.emit('getFans', rows[i].room_id);
            }
        } else {
            isFinish = true;
        }
    });
    if (isFinish) {
        isFinish = false;
        return true;
    } else {
        return false;
    }
};

myEvents.on('getFans', function (room_id) {
    console.log(room_id);
    var options = {
        method: 'GET',
        encoding: null,
        url: 'http://v.6.cn/profile/index.php?rid=' + room_id
    };
    request(options, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var fans = 0;
        try {
            var $ = cheerio.load(body);
            //fans = $('.js_followNum').toArray();
            fans = $('.js_followNum').toArray()["0"].children["0"].data;
        } catch (e) {
            console.log(e + "----net---");
        }
        myEvents.emit('updateInfo', fans, room_id);
    });
});

myEvents.on('updateInfo', function (fans, room_id) {
    var sql = 'UPDATE sixrooms SET fans = ? WHERE room_id = ?';
    var parms = [fans, room_id];
    conn.query(sql, parms, function (err) {
        if (err) {
            console.log(err + "---sql---");
        }
    })
});