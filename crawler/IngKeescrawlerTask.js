/**
 * Created by hzq on 16-6-20.
 */
var request = require('request'),
    mysql = require('mysql'),
    cheerio = require('cheerio'),
    config = require("../config.js"),
    conn = mysql.createConnection(config.db),
    EventEmitter = require('events').EventEmitter;

var myEvents = new EventEmitter();
// var isFinish = false;
// var isMainFinish = false;
var start = 1;
var page = 1;
/**
 * @return{boolean}
 */

exports.getMainData1 = function () {

    if (page > 10) {
        page = 1;
        return true;
    } else {
        myEvents.emit('initData1');
        page++;
        return false;
    }
};

myEvents.on('initData1', function () {
    var ingkeeApi = {
        method: 'GET',
        encoding: null,
        // http://service.ingkee.com/api/live/homepage_new?proto=3&location=38  长的
        // http://service.ingkee.com/api/live/simpleall?proto=3&multiaddr=1 短的
        url: "http://service.ingkee.com/api/live/simpleall"
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(ingkeeApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        if (data.lives.length == 0) {
            // isMainFinish = true;
            return;
        }
        acquireData(data);
    })
});

exports.getMainData2 = function () {

    if (start > 10) {
        start = 1;
        return true;
    } else {
        myEvents.emit('initData2');
        start++;
        return false;
    }
};

myEvents.on('initData2', function () {
    var ingkeeApi2 = {
        method: 'GET',
        encoding: null,
        // http://service.ingkee.com/api/live/homepage_new?proto=3&location=38  长的
        // http://service.ingkee.com/api/live/simpleall?proto=3&multiaddr=1 短的
        url: "http://service.ingkee.com/api/live/homepage_new"
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(ingkeeApi2, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        if (data.lives.length == 0) {
            // isMainFinish = true;
            return;
        }
        acquireData(data);
    })
});

function acquireData(data) {
    var sql = 'replace INTO ingkee (room_id, room_name, owner_uid, nickname, online, game_name, fans, tags, face) VALUES (?,?,?,?,?,?,?,?,?)';
    if (data.lives.length == 0) {
        return console.log('没有数据了');
    }
    //http://img.meelive.cn/

    data.lives.forEach(function (item) {
        if (!(item.creator.portrait.includes("http"))) {
            item.creator.portrait = "http://img.meelive.cn/" + item.creator.portrait;
        }
        var params = [item.creator.id, item.name, item.creator.id, item.creator.nick, item.online_users, null, 0, null, item.creator.portrait];
        conn.query(sql, params, function (err, result) {
            if (err) {
                return console.log(err);
            }
        });
    });
}

var isFinish = false;
var pn = 1;
exports.updateOthers = function () {
    var limit_range = (pn - 1) * 10 + ',' + 10;
    var Sql = 'SELECT * FROM ingkee limit ' + limit_range + ';';
    conn.query(Sql, function (err, rows) {
        if (err) {
            return console.log(err + '------------sql err--------------')
        }
        if (rows.length == 0) {
            return isFinish = true;
        }
        pn++;
        for (var i = 0; i < rows.length; i++) {
            myEvents.emit('update', rows[i].room_id);
        }
    });
    if (isFinish) {
        isFinish = false;
        return true;
    } else {
        return false;
    }
};

myEvents.on('update', function (room_id) {
    var optionsfordetail = {
        method: 'GET',
        encoding: null,
        url: 'http://service5.inke.tv/api/user/relation/numrelations?id=' + room_id
    };
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            if (data.length == 0) {
                // isMainFinish = true;
                return;
            }
            acquireData2(data);
        } else {
            return console.log(room_id + error);
        }

    });
});

function acquireData2(data) {
    var sql = 'UPDATE ingkee SET fans = ? WHERE room_id = ?';
    var parms = [data.num_followings, room_id];
    conn.query(sql, parms, function (err) {
        if (err) {
            console.log(err + "---sql---");
        }
    });
}





































