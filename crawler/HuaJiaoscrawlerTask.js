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
var starpage = 1,
    godnesspage = 1,
    godmanpage = 1,
    gethlivepage = 1;
/**
 * @return{boolean}
 */
exports.getStar = function () {

    var options = {
        method: 'GET',
        encoding: null,
        url: "http://www.huajiao.com/category/1?pageno=" + starpage
    };
    request(options, function (err, response, body) {
        starpage = starpage + 1;
        if (err) {
            console.log('pageno=' + starpage);
            return console.log('明星来了' + err);
        }
        try {
            var $ = cheerio.load(body);
            //var tag = $('.current').toArray();
            var room_id = $('.feed .link').toArray();
            var username = $('.username').toArray();
            var face = $('.avatar').toArray();
            var tag = "明星来了";
            if (body.indexOf('title') < 0) {
                starpage = -9999;
                return console.log('明星来了no more data');
            }
            acquireData(room_id, username, tag, face);
        } catch (e) {
            console.log(e + "明星来了-----net----");
        }
    });

    if (starpage < 0) {
        return true;
    } else {
        return false;
    }
};

exports.getGodNess = function () {

    var options = {
        method: 'GET',
        encoding: null,
        url: "http://www.huajiao.com/category/2?pageno=" + godnesspage
    };
    request(options, function (err, response, body) {
        godnesspage = godnesspage + 1;
        if (err) {
            console.log('pageno=' + godnesspage);
            return console.log('女神驾到' + err);
        }
        try {
            var $ = cheerio.load(body);
            var room_id = $('.feed .link').toArray();
            var username = $('.username').toArray();
            var face = $('.avatar').toArray();
            var tag = "女神驾到";
            if (body.indexOf('title') < 0) {
                godnesspage = -9999;
                return console.log('女神驾到no more data');
            }
            acquireData(room_id, username, tag, face);
        } catch (e) {
            console.log(e + "女神驾到-----net----");
        }
    });

    if (godnesspage < 0) {
        return true;
    } else {
        return false;
    }
};

exports.getGodMan = function () {

    var options = {
        method: 'GET',
        encoding: null,
        url: "http://www.huajiao.com/category/5?pageno=" + godmanpage
    };
    request(options, function (err, response, body) {
        godmanpage = godmanpage + 1;
        if (err) {
            console.log('pageno=' + godmanpage);

            return console.log('国民男神' + err);
        }
        try {
            var $ = cheerio.load(body);
            var room_id = $('.feed .link').toArray();
            var username = $('.username').toArray();
            var face = $('.avatar').toArray();
            var tag = "国民男神";
            if (body.indexOf('title') < 0) {
                godmanpage = -9999;
                return console.log('国民男神no more data');
            }
            acquireData(room_id, username, tag, face);
        } catch (e) {
            console.log(e + "国民男神-----net----");
        }
    });

    if (godmanpage < 0) {
        return true;
    } else {
        return false;
    }
};

exports.getHLive = function () {

    var options = {
        method: 'GET',
        encoding: null,
        url: "http://www.huajiao.com/category/3?pageno=" + gethlivepage
    };
    request(options, function (err, response, body) {
        gethlivepage = gethlivepage + 1;
        if (err) {
            console.log('pageno=' + gethlivepage);
            return console.log('高清直播' + err);
        }
        try {
            var $ = cheerio.load(body);
            var room_id = $('.feed .link').toArray();
            var username = $('.username').toArray();
            var face = $('.avatar').toArray();
            var tag = "高清直播";
            if (body.indexOf('title') < 0) {
                gethlivepage = -9999;
                return console.log('高清直播no more data');
            }
            acquireData(room_id, username, tag, face);
        } catch (e) {
            console.log(e + "高清直播-----net----");
        }
    });

    if (gethlivepage < 0) {
        starpage = 1;
        godnesspage = 1;
        godmanpage = 1;
        gethlivepage = 1;
        return true;
    } else {
        return false;
    }
};

function acquireData(room_id, username, tag, face) {
    //room_id[i].attribs.href.substring(3)
    var sql = 'replace INTO huajiao (room_id, room_name, owner_uid, nickname, online, fans, tags, face) VALUES ?';
    if (username.length == 0) {
        return console.log('没有数据了');
    }
    var values = [];
    for (var i = 0; i < username.length; i++) {
        var room_id1 = 0;
        var nickname = username[i].children["0"].data;
        var face1 = '';
        try {
            var href = room_id[i].attribs.href;
            room_id1 = href.substring(3);
            face1 = face[i].children["0"].attribs.src;
        } catch (e) {
            console.log(room_id1);
        }
        var params = [room_id1, 0, 0, nickname, 0, 0, tag, face1];
        values.push(params);

    }
    conn.query(sql, [values], function (err, result) {
        if (err) {
            return console.log('sql' + err);
        }
        // conn.end();
    });
}

var isFinish = false;
var page = 1;
exports.updateOthers = function () {
    var limit_range = (page - 1) * 10 + ',' + 10;
    var Sql = 'SELECT * FROM huajiao limit ' + limit_range + ';';
    conn.query(Sql, function (err, rows) {
        if (err) {
            return console.log(err + '------------sql err--------------')
        }
        if (rows.length == 0) {
            return isFinish = true;
        }
        page++;
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
        //encoding: null,
        url: 'http://www.huajiao.com/l/' + room_id
    };
    /**room_name ('head title')
     * online "watches": 36030
     * uid "uid": "24649355",
     * fans <div class="fans">
     * */
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var $ = cheerio.load(body);
                var room_name = $('head title').toArray()["0"].children["0"].data;
                var fans = $('.fans').toArray()["0"].children["0"].next.children["0"].data;
                var online = body.substring(body.indexOf('watches') + 9, body.indexOf('"reposts"')).trim().replace(/,$/, "");
                var owner_uid = body.substring(body.indexOf('uid') + 6, body.indexOf('uid') + 14);
                var a = body.indexOf('uid') + 6;
                var b = body.indexOf('uid') + 14;
                //console.log(a + '\n' + b);
                //console.log(room_name + '\n' + online + '\n' + uid);
            } catch (e) {
                console.log(e + '-----------------');
            }
        } else {
            return console.log(room_id + error);
        }
        myEvents.emit('updateInfo', room_name, fans, online, owner_uid, room_id);
    });
});

myEvents.on('updateInfo', function (room_name, fans, online, owner_uid, room_id) {
    var sql = 'UPDATE huajiao SET room_name = ?, fans = ?, online = ?, owner_uid = ? WHERE room_id = ?';
    var parms = [room_name, fans, online, owner_uid, room_id];
    conn.query(sql, parms, function (err) {
        if (err) {
            console.log(err + "---sql---");
        }
    })
});
















