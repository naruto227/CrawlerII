/**
 * Created by deng on 16-6-3.
 */
var request = require('request');
var mysql = require('mysql');
var cheerio = require("cheerio");
var config = require("../config.js");
var conn = mysql.createConnection(config.db);
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var page = 1;
var tag = 1;
var isFinish = false;
var isTagFinish = false;
exports.getMainData = function () {
    var options1 = {
        method: 'GET',
        encoding: null,
        url: 'http://live.bilibili.com/area/liveList?area=all&order=online&page=' + page
    };

    request(options1, function (error, response, body) {
        if (error) {
            return console.log(error)
        }
        try {
            acquireData(JSON.parse(body));
        } catch (e) {
            console.log(e);
        }


        // console.log(page + '页码');
        page = page + 1;
    });
    if (isFinish||page>40) {
        isFinish = false;
        page = 1;
        return true;
    } else {
        return false;
    }


};
function acquireData(data) {
    var sql = 'replace INTO bilibli (room_id, room_name, owner_uid, nickname, online, game_name, fans,tags,face) VALUES ?';
    var values=[];
    try {
        if (data.data.length == 0) {
            isFinish = true;
            return console.log('没有数据了');
        }
        data.data.forEach(function (item) {

            var params = [item.roomid, item.title, item.uid, item.uname, item.online, '', 0, '',item.cover];
            values.push(params);
            

        });
        conn.query(sql, [values], function (err, result) {
            if (err) {
                console.log(err);
                return;
            }

        });
    } catch (e) {
        console.log(e)
    }
}


exports.updateTagsAndfans = function () {
    var limit_range = (tag - 1) * 10 + ',' + 10;

    var userAddSql = 'SELECT * FROM bilibli limit ' + limit_range + ';';
    conn.query(userAddSql, function (err, rows, fields) {
        if (err) {
            console.log(err);
        }
        if (rows.length > 0) {
            tag = tag + 1;
            for (var i = 0; i < rows.length; i++) {
                myEvents.emit('getTag', rows[i].room_id);
            }
        } else {
            isTagFinish = true;
        }
    });
    if (isTagFinish) {
        isTagFinish = false;
        return true;
    } else {
        return false;
    }

};
myEvents.on('getTag', function (room_id) {
    // console.log(room_id);
    var options = {
        method: 'GET',
        encoding: null,
        url: 'http://live.bilibili.com/live/getInfo?roomid=' + room_id
    };

    request(options, function (error, response, body) {
        if (error) {
            return console.log(error)
        }
        try {
            var fanscount = JSON.parse(body).data.FANS_COUNT;
            var options1 = {
                method: 'GET',
                encoding: null,
                url: 'http://live.bilibili.com/' + room_id
            };
            request(options1, function (error, response, body1) {
                if (error) {
                    return console.log(error)
                }
                var alltags = '';
                var type = '';
                try {
                    var $ = cheerio.load(body1);
                    var partName = $('.part-name').toArray();
                    var tags = $('.tag-box').toArray();
                    type = partName["0"].children["0"].data;
                    alltags = tags["0"].attribs.tags;
                } catch (e) {
                    console.log(e + "----net----");
                }
                myEvents.emit('updateInfo', fanscount, type, alltags, room_id);

            });
        } catch (e) {
            console.log(e);
        }

    });
});

myEvents.on('updateInfo', function (fanscount, type, alltags, room_id) {
    var sql = 'UPDATE bilibli SET fans = ?,game_name=?,tags=? WHERE room_id = ?';
    var parms = [fanscount, type, alltags, room_id];
    conn.query(sql, parms, function (err, result) {
        if (err) {
            console.log(err + "---sql----");
        }
    })
});