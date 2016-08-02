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

    if (page > 8) {
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

    if (start > 8) {
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
    var sql = 'replace INTO ingkee (room_id, room_name, owner_uid, nickname, online, game_name, fans, tags, face) VALUES ?';
    if (data.lives.length == 0) {
        return console.log('没有数据了');
    }
    //http://img.meelive.cn/
    var param=[];
    // data.lives.forEach(function (item) {
    //
    // });
    for(var i=0;i<data.lives.length;i++){
        var item=data.lives[i];
        if (!(item.creator.portrait.includes("http"))) {
            item.creator.portrait = "http://img.meelive.cn/" + item.creator.portrait;
        }
        // console.log(JSON.stringify(item));
        var params = [item.id, item.name, item.creator.id, item.creator.nick, item.online_users, null, 0, null, item.creator.portrait];
        param.push(params);
    }
    conn.query(sql, [param], function (err, result) {
        if (err) {
            conn.end();
            return console.log(err + "ingkee sql1");
        }
    });
}

var isFinish = false;
var pn = 1;
exports.updateOthers = function () {
    var limit_range = (pn - 1) * 10 + ',' + 10;
    var Sql = 'SELECT * FROM ingkee WHERE fans = 0 limit ' + limit_range + ';';
    conn.query(Sql, function (err, rows) {
        if (err) {
            conn.end();
            return console.log(err + "ingkee sql2");
        }
        if (rows.length == 0) {
            return isFinish = true;
        }
        pn++;
        for (var i = 0; i < rows.length; i++) {
            myEvents.emit('update', rows[i].owner_uid);
        }
    });
    if (isFinish) {
        isFinish = false;
        return true;
    } else {
        return false;
    }
};

myEvents.on('update', function (uid) {
    var optionsfordetail = {
        method: 'GET',
        encoding: null,
        url: 'http://service5.inke.tv/api/user/relation/numrelations?id=' + uid
    };
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            if (data.length == 0) {
                // isMainFinish = true;
                return;
            }
            acquireData2(data, uid);
        } else {
            return console.log(uid + error);
        }

    });
});

function acquireData2(data, uid) {
    var sql = 'UPDATE ingkee SET fans = ? WHERE owner_uid = ?';
    var parms = [data.num_followers, uid];
    conn.query(sql, parms, function (err) {
        if (err) {
            conn.end();
            return console.log(err + "ingkee sql3");
        }
    });
}





































