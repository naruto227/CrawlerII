/**
 * Created by huang on 16-6-12.
 */
var cheerio = require('cheerio'),
    // request = require('request'),
    schedule = require('node-schedule'),
    EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var HuaJiaoscrawler = require("../crawler/HuaJiaoscrawlerTask.js");
var uploadService = require("../uploadModel/upload.js");
var rule = new schedule.RecurrenceRule();

var times = [];
var isRunning = false;
/**
 * @return{boolena}
 */
exports.huajiao = function () {
    if (isRunning) {
        return false;
    } else {
        isRunning = true;
        sub();
        return true;
        // face[i].children["0"].attribs.src
    }
};

myEvents.on('start', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 3) {
        times.push(i);
    }//getStar  http://www.huajiao.com/category/1?pageno=
    //getGodNess   http://www.huajiao.com/category/2?pageno=
    //getGodMan  http://www.huajiao.com/category/5?pageno=
    //getHLive  http://www.huajiao.com/category/3?pageno=
    schedule.scheduleJob(rule, function () {
        if (HuaJiaoscrawler.getStar()) {
            if (HuaJiaoscrawler.getGodNess()) {
                if (HuaJiaoscrawler.getGodMan()) {
                    if (HuaJiaoscrawler.getHLive()) {
                        this.cancel();
                        console.log('-------------爬完啦----------------');
                        myEvents.emit('updateOther');
                    }
                }
            }
        }
    });
});

myEvents.on('updateOther', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 10) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (HuaJiaoscrawler.updateOthers()) {
            this.cancel();
            console.log('------------更新完了---------------');
            isRunning = false;
            myEvents.emit('gameover');
        }
    });
});

myEvents.on('gameover', function () {
    uploadService.uploadServe('huajiao');
});

var mypretime = 0;
function sub() {
    var Today = new Date();
    var NowHour = Today.getHours();
    var NowMinute = Today.getMinutes();
    var NowSecond = Today.getSeconds();
    var mysec = (NowHour * 3600) + (NowMinute * 60) + NowSecond;
    if ((mysec - mypretime) > 10) {
        //10只是一个时间值，就是10秒内禁止重复提交，值随便设
        mypretime = mysec;
    } else {
        return;
    }
    myEvents.emit('start');
}