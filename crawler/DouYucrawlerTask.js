var request = require('request');

var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();

var count = 0;
var mysql = require('mysql');
var config = require("../config.js");
var cheerio = require("cheerio");
//var start =11111;
//var start =18955;
var start = 1;
var page = 0;
var conn = mysql.createConnection(config.db);
var isTagFinish = false;
/**
 * @return {boolean}
 */
exports.UpTags = function () {
    if (isTagFinish) {
        start = 1;
        isTagFinish = false;
        return true;
    } else {
        var limit_range = (start - 1) * 10 + ',' + 10;
        var userAddSql = 'SELECT * FROM dy limit ' + limit_range + ';';
        conn.query(userAddSql, function (err, rows, fields) {
            if (err) {
                return console.log(err.message)
            }
            ;
            var length = rows.length;
            if (length == 0) {
                isTagFinish = true;
                return;
            }
            for (var i = 0; i < length; i++) {
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
        url: "http://www.douyu.com/" + room_id
    };
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var $ = cheerio.load(body);  //cheerio解析data
                var tags = '';
                var roomname = $('head title').toArray();
                if (roomname["0"].children["0"].data == "提示信息 -斗鱼") {
                    return;
                }
                var zhubotag = $('.live-room .relate-text .r-else-tag dd').toArray();
                var len = zhubotag.length;
                for (var i = 0; i < len; i++) {
                    tags = tags + zhubotag[i].children["1"].attribs.title + ','
                }
                myEvents.emit('updateTags', tags, room_id);
            } catch (e) {
                console.log(e)
            }
        }
    });
});
myEvents.on('updateTags', function (mTags, room_id) {
    var updateSql = 'UPDATE douyu SET tags = ? WHERE room_id = ?';
    var updateParams = [mTags, room_id];
    conn.query(updateSql, updateParams, function (err, result) {
        if (err) {
            return console.log(err);
        }
    })
});
var isFinish = false;
exports.getMainData = function () {
    if (isFinish) {
        isFinish = false;
        page = 1;
        return true;
    } else {
        myEvents.emit('initData', page);
        page++;
        return false;
    }

};
myEvents.on('initData', function (pn) {
    var douyuApi = {
        method: 'GET',
        encoding: null,
        url: "http://capi.douyucdn.cn/api/v1/live?limit=100&offset=" + parseInt(pn) * 100
    };
    request(douyuApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        try {
            var data = JSON.parse(body);
            if (data.data.length == 0) {
                isFinish = true;
                return;
            }
            acquireData(data)
        } catch (e) {
            console.log(e)
        }

    })

});
function acquireData(data) {
    var sql = 'replace INTO douyu (room_id, room_name, owner_uid, nickname, online, game_name, fans,face) VALUES ?';
    if (data.data.size == 0) {
        return console.log('没有数据了');
    }
    var values = [];
    data.data.forEach(function (item) {
        var params = [item.room_id, item.room_name, item.owner_uid, item.nickname, item.online, item.game_name, item.fans, item.avatar];
        values.push(params);


    });
    conn.query(sql, [values], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }


    });
}


