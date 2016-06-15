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
            return console.log(err);
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
                return console.log('no more data');
            }
            acquireData(room_id, username, tag, face);
        } catch (e) {
            console.log(e + "-----net----");
        }
    });

    if (starpage < 0) {
        return true;
    } else {
        return false;
    }
};


function acquireData(room_id, username, tag, face) {
    //room_id[i].attribs.href.substring(3)
    var sql = 'replace INTO huajiao (room_id, room_name, owner_uid, nickname, online, game_name, fans, tags, face) VALUES (?,?,?,?,?,?,?,?,?)';
    if (username.length == 0) {
        return console.log('没有数据了');
    }
    for (var i = 0; i < username.length; i++) {
        var room_id = 0;
        var nickname = username[i].children["0"].data;
        var face = 0;
        try {
            var href = room_id[i].attribs.href;
            room_id = href.substring(3);
            face = face[i].attribs.src;
        }catch (e){
            console.log(room_id[i]);
        }
        var params = [room_id, 0, 0, nickname, 0, 0, 0, tag, face];
        conn.query(sql, params, function (err, result) {
            if (err) {
                return console.log(err);
            }
        });
    }
}
















