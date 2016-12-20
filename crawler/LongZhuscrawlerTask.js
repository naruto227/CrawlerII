/**
 * Created by huang on 16-6-12.
 */
/**
 * http://api.plu.cn/tga/streams?max-results=18&start-index=18
 * max-results等价于limit,start-index等价于offset
 * */
var request = require('request'),
    /*mysql = require('mysql'),
    
    config = require("../config.js"),
    conn = mysql.createConnection(config.db),*/
    cheerio = require('cheerio'),
    SqlUtils = require("../Utils/SqlUtils"),
    EventEmitter = require('events').EventEmitter;

var myEvents = new EventEmitter();
// var isFinish = false;
var isMainFinish = false;
//var start = 1;
var page = 1;
/**
 * @return{boolean}
 */

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
    var longzhuApi = {
        method: 'GET',
        encoding: null,
        url: "http://api.plu.cn/tga/streams?max-results=50&start-index=" + parseInt(pn) * 50
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(longzhuApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        if (data.data.items.length == 0) {
            isMainFinish = true;
            return;
        }
        acquireData(data);
    })
});
function acquireData(data) {
    var sql = 'replace INTO longzhu (room_id, room_name, owner_uid, nickname, online, game_name, fans, tags, face) VALUES ?';
    if (data.data.length == 0) {
        return console.log('没有数据了');
    }
    var values = [];
    data.data.items.forEach(function (item) {
        var params = [item.channel.url.substring(24), item.channel.status, item.channel.id, item.channel.name, item.viewers, item.game["0"].name, item.channel.followers, item.channel.tag, item.channel.avatar];
        values.push(params);
    });
    SqlUtils(function (conn) {
        conn.query(sql, [values], function (err, result) {
            if (err) {
                return console.log(err);
            }
        })
    });
}
/**

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
 */
