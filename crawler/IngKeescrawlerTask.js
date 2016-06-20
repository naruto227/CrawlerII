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
var isMainFinish = false;
//var start = 1;
// var page = 30;
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
        // http://service.ingkee.com/api/live/homepage_new?proto=3&location=38  长的
        // http://service.ingkee.com/api/live/simpleall?proto=3&multiaddr=1 短的
        url: "http://api.plu.cn/tga/streams?max-results=50&start-index=" + parseInt(pn) * 50
    };//fans:http://v.6.cn/profile/index.php?rid=room_id    <b class="js_followNum" id="ipbzcwoz">182987</b>
    request(longzhuApi, function (err, response, body) {
        if (err) {
            return console.log(err);
        }
        var data = JSON.parse(body);
        if (data.data.items.length== 0) {
            isMainFinish = true;
            return;
        }
        acquireData(data);
    })
});
function acquireData(data) {
    var sql = 'replace INTO longzhu (room_id, room_name, owner_uid, nickname, online, game_name, fans, tags, face) VALUES (?,?,?,?,?,?,?,?,?)';
    if (data.data.length == 0) {
        return console.log('没有数据了');
    }
    data.data.items.forEach(function (item) {
        var params = [item.channel.url.substring(24), item.channel.status, item.channel.id, item.channel.name, item.viewers, item.game["0"].name, item.channel.followers, item.channel.tag, item.channel.avatar];
        conn.query(sql, params, function (err, result) {
            if (err) {
                return console.log(err);
            }
        });
    });
}