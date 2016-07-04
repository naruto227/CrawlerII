var request = require('request');
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var count = 0;
var mysql = require('mysql');
var config = require("../config.js");
var conn = mysql.createConnection(config.db);
//var start =11111;
//var start =18955;
var start = 1;
var yulepage = 1;
var mcpage = 1;
var livepage = 1;
var showpage = 1;
var dancepage = 1;
var gamepage=1;
var yule = true;
exports.getYULE = function () {

    var options1 = {
        method: 'GET',
        encoding: null,
        url: "http://www.yy.com/more/page.action?biz=other&subBiz=idx&moduleId=79&page=" + yulepage
    };

    request(options1, function (error, response, body) {
        yulepage = yulepage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                yulepage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }

    });
    if (yulepage < 0) {

        return true;
    } else {
        return false;
    }

};
exports.getMC = function () {

    var options1 = {
        method: 'GET',
        encoding: null,
        url: "http://www.yy.com/specialMore/page?biz=mc&moduleId=29&page=" + mcpage
    };

    request(options1, function (error, response, body) {
        mcpage = mcpage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                mcpage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }
    });
    if (mcpage < 0) {

        return true;
    } else {
        return false;
    }
};
exports.getLIVE = function () {
    if (livepage < 0) {

        return true;
    }
    var options1 = {
        method: 'GET',
        encoding: null,
        url: "http://www.yy.com/more/page.action?biz=sing&subBiz=idx&moduleId=95&page=" + livepage
    };

    request(options1, function (error, response, body) {
        livepage = livepage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                livepage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }
    });
    return false;

};
exports.getSHOW = function () {
    if (showpage < 0) {

        return true;
    }
    var options1 = {
        method: 'GET',
        encoding: null,
        url: "http://www.yy.com/specialMore/page?biz=talk&subBiz=&moduleId=21&page=" + showpage
    };

    request(options1, function (error, response, body) {
        showpage = showpage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                showpage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }
    });

    return false;

};
exports.getGAME = function () {
    if (gamepage < 0) {

        return true;
    }
    var options1 = {
        method: 'GET',
        encoding: null,
        url: "http://www.yy.com/specialMore/page?biz=talk&subBiz=&moduleId=21&page=" + gamepage
    };

    request(options1, function (error, response, body) {
        gamepage = gamepage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                gamepage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }
    });

    return false;

};
exports.getDANCE = function () {

    var options1 = {
        method: 'GET',
        encoding: null,
        url: " http://www.yy.com/specialMore/page?biz=dance&moduleId=11&page=" + dancepage
    };

    request(options1, function (error, response, body) {
        dancepage = dancepage + 1;
        if (error) {
            return console.log(error);
        }
        try {
            var parse = JSON.parse(body);
            if (parse.data.data.length == 0) {
                dancepage = -9999;
                return console.log('no more data');
            }
            acquireData(parse);
        } catch (e) {
            console.log(e)
        }
    });
    if (dancepage < 0) {
        mcpage = 1;
        livepage = 1;
        showpage = 1;
        yulepage = 1;
        dancepage = 1;
        gamepage =1;
        return true;
    } else {
        return false;
    }
};
function acquireData(data) {
    var sql = 'replace INTO yy (room_id, room_name, owner_uid, nickname, online, game_name, fans,tags,face) VALUES ?';
    try {
        if (data.data.data.size == 0) {
            return console.log('没有数据了');
        }
        var values = [];
        data.data.data.forEach(function (item) {

            var params = [item.sid, item.desc, item.uid, item.name, item.users, item.biz, 0, item.tag, item.avatar];
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
var page = 1;
var isGetFansFinish = false;
exports.getFans = function () {

    var limit_range = (page - 1) * 10 + ',' + 10;
    var Sql = 'SELECT * FROM yy limit ' + limit_range + ';';
    conn.query(Sql, function (err, rows, field) {
        if (err) {
            return console.log(err + '------------sql err--------------')
        }
        if (rows.length == 0) {
            return isGetFansFinish = true;
        }
        page++;
        for (var i = 0; i < rows.length; i++) {
            myEvents.emit('updateFans', rows[i].room_id, rows[i].owner_uid);
        }
    });
    if (isGetFansFinish) {
        isGetFansFinish = false;
        return true;
    } else {
        return false;
    }
};
myEvents.on('updateFans', function (room_id, owner_uid) {
    var optionsfordetail = {
        method: 'GET',
        encoding: null,
        url: 'http://www.yy.com/live/detail?uid=' + owner_uid +
        '&sid=' + room_id +
        '&ssid=' + room_id
    };
    request(optionsfordetail, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            try {
                var parse = JSON.parse(body);
                var numOfFun = parse.data.numOfFun;
                myEvents.emit('updateTable', numOfFun, room_id);
            } catch (e) {
                console.log(e)
            }
        }
    });
});

myEvents.on('updateTable', function (numOfFun, room_id) {

    var updateSql = 'update yy set fans=? where room_id =?';
    var updateParams = [numOfFun, room_id];
    conn.query(updateSql, updateParams, function (err, rows, field) {
        if (err) {
            console.log('------------sql update err--------------' + err)
        }
    })
});
