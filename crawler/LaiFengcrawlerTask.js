/**
 * Created by huang on 16-6-12.
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
var page = 1;
/**
 * @return{boolean}
 */

exports.getMainData = function () {
    if (isMainFinish || page >= 80) {
        console.log(page + "---------------------------");
        isMainFinish = false;
        page = 1;
        return true;
    } else {
        myEvents.emit('initData', page);
        page++;
        return false;
    }
    /*if (page > 150) {
     console.log(page + "---------------------------");
     isMainFinish = false;
     page = 1;
     return true;
     }*/
};

myEvents.on('initData', function (pn) {
    var laifengApi = {
        method: 'GET',
        encoding: null,
        url: "http://www.laifeng.com/center?pageNo=" + pn
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(laifengApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var $ = cheerio.load(body);
        //var data = JSON.parse(body);
        //var pic = $(".pic a img").toArray();
        //var pic = $(".pic a img").attr().src;
        //var href = $(".user-list .name a").toArray()["0"].attribs.href;
        var name = $(".user-list .name a").toArray();
        var data = $(".user-list .data ").toArray();
        var pic = $(".user-list .pic img").toArray();
        if (name.length == 0) {
            isMainFinish = true;
            return;
        }

        //var room_id = href.substring(21,href.length);

        /*if (data.roomList.length == 0) {
         isMainFinish = true;
         return;
         }*/
        acquireData(name, data, pic);
    })
});
function acquireData(name, data, pic) {

    var sql = 'replace INTO laifeng (room_id, room_name, owner_uid, nickname, online, fans, tags, face) VALUES ?';
    if (data.length == 0) {
        // isMainFinish = true;
        return console.log('没有数据了');
    }
    var values = [];
    for (var i = 0; i < name.length; i++) {
        var href = name[i].attribs.href;
        var room_id = href.substring(21, href.length);
        var roomname = name[i].attribs.title;
        var face = pic[0].attribs.src;
        var online = 0;
        try {
            online = data[i].children["4"].data.replace(/[^0-9]/ig, "");//正则表达，获取数字
        } catch (e) {
            // console.log(roomname);
            return;
        }
        //var online = data[i].children["4"].data;//这个方法会产生一个\n
        var face = pic[i].attribs.src;
        var params = [room_id, roomname, 0, 0, online, 0, 0, face];
        values.push(params);
    }
    conn.query(sql, [values], function (err, result) {
        if (err) {
            return console.log(err);
        }
    });
}

exports.updateFans = function () {
    var limit_range = (start - 1) * 10 + ',' + 10;
    var sql = 'SELECT * FROM laifeng limit ' + limit_range + ';';
    conn.query(sql, function (err, rows) {
        if (err) {
            return console.log(err);
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
    // console.log(room_id);
    // var options = {
    //     method: 'GET',
    //     // encoding: null,
    //     url: 'http://v.laifeng.com/' + room_id
    // };
    request('http://v.laifeng.com/' + room_id, function (err, response, body) {
        if (err) {
            return console.log(room_id + err);
        }
        var fans = 0;
        try {
            var face = body.substring(body.indexOf('anchorFaceUrl') + 14, body.indexOf('anchorFansNum')).trim().replace(/,$/, "").replace(/\'|’|‘/g, "");
            fans = body.substring(body.indexOf('FansNum:') + 8, body.indexOf('anchorHadBeans')).trim().replace(/,$/, "");
            // var userId = body.substring(body.indexOf('userId:') + 7, body.indexOf('userName')).trim().replace(/,$/, "").replace(/\'|’|‘/g, "");
            var owner_uid = body.substring(body.indexOf('anchorId:') + 9, body.indexOf('isGold')).trim().replace(/,$/, "").replace(/\'|’|‘/g, "");
            var nickname = body.substring(body.indexOf('anchorName:') + 11, body.indexOf('anchorLevel')).trim().replace(/,$/, "").replace(/\'|’|‘/g, "");
            var tag = body.substring(body.lastIndexOf('anchorSign:') + 11, body.lastIndexOf('gender')).trim().replace(/,$/, "").replace(/\'|’|‘/g, "");

        } catch (e) {
            console.log(e + "----net---");
        }
        myEvents.emit('updateInfo', fans, face, owner_uid, nickname, tag, room_id);
    });
});

myEvents.on('updateInfo', function (fans, face, owner_uid, nickname, tag, room_id) {
    var sql = 'UPDATE laifeng SET fans = ?,face = ?,owner_uid = ?,nickname = ?, tags = ? WHERE room_id = ?';
    var parms = [fans, face, owner_uid, nickname, tag, room_id];
    conn.query(sql, parms, function (err) {
        if (err) {
            return console.log(err + "---sql---");
        }
    })
});