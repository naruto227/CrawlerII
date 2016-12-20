var request = require('request');


var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();

var count = 0;

//var start =11111;
//var start =18955;
var start = 1;
var page = 0;
var SqlUtils = require("../Utils/SqlUtils");

var isFinish = false;
var isMainFinish = false;
exports.updateTag = function () {
    if (isFinish) {
        start = 1;
        isFinish = false;
        return true;

    } else {
        var limit_range = (start - 1) * 10 + ',' + 10;
        var userAddSql = 'SELECT * FROM panda limit ' + limit_range + ';';
        SqlUtils(function (conn) {
            conn.query(userAddSql, function (err, rows, fields) {
                if (err) {
                    console.log(err.message);
                    return;
                }

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
        });

    }


};
myEvents.on('geted', function (room_id) {
    var optionsfordetail = {
        method: 'GET',
        encoding: null,
        url: "http://www.panda.tv/api_room?roomid=" + room_id
    };
    request(optionsfordetail, function (error, response, body) {
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            var fans = parse.data.roominfo.fans;
            var bulletin = parse.data.roominfo.bulletin;
            var classification = parse.data.roominfo.classification;

            myEvents.emit('updateTags', fans, bulletin, classification, room_id);
        } catch (e) {
            console.log(e);
        }
    });
});
myEvents.on('updateTags', function (fans, mTags, classification, room_id) {
    var updateSql = 'UPDATE panda SET tags = ?,fans= ?,game_name=? WHERE room_id = ?';
    var updateParams = ['', fans, classification, room_id];
    SqlUtils(function (conn) {

        conn.query(updateSql, updateParams, function (err, result) {
            if (err) {
                return console.log(err);
            }

        })
    });

});

exports.getMainData = function () {
    if (isMainFinish) {
        isMainFinish = false;
        page = 0;
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
        url: "http://api.m.panda.tv/ajax_live_lists?pagenum=100&pageno=" + parseInt(pn)
    };
    request(douyuApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        if (data.data.items.length == 0) {
            isMainFinish = true;
            return;
        }
        acquireData(data)
    })

});
function acquireData(data) {
    var sql = 'replace INTO panda (room_id, room_name, owner_uid, nickname, online, game_name, fans,face) VALUES ?';
    if (data.data.size == 0) {
        return console.log('没有数据了');
    }
    var values = [];
    data.data.items.forEach(function (item) {
        var params = [item.id, item.name, item.hostid, item.userinfo.nickName, item.person_num, item.classification, 0, item.userinfo.avatar];
        values.push(params);
    });
    SqlUtils(function (conn) {

        conn.query(sql, [values], function (err, result) {
            if (err) {
                console.log(err);
                return;
            }

        });
    });
}

