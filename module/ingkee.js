/**
 * Created by hzq on 16-6-20.
 */
var cheerio = require('cheerio'),
    // request = require('request'),
    schedule = require('node-schedule'),
    EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var IngKeescrawler = require("../crawler/IngKeescrawlerTask.js");
var uploadService = require("../uploadModel/upload.js");
var rule = new schedule.RecurrenceRule();

var times = [];
var isRunning = false;
/**
 * @return{boolena}
 */
exports.ingkee = function () {
    if (isRunning) {
        return false;
    } else {
        isRunning = true;
        sub();
        return true;
    }
};

myEvents.on('start', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 3) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (IngKeescrawler.getMainData()) {
            this.cancel();
            console.log('-------------爬完啦----------------');
            myEvents.emit('gameover');
        }
    });
});

myEvents.on('gameover', function () {
    uploadService.uploadServe('longzhu');
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
