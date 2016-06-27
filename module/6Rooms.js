/**
 * Created by huang on 16-6-11.
 */
var cheerio = require('cheerio'),
    // request = require('request'),
    schedule = require('node-schedule'),
    EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var SixRoomscrawler = require("../crawler/6RoomscrawlerTask.js");
var uploadService = require("../uploadModel/upload.js");
var rule = new schedule.RecurrenceRule();

var times = [];
var isRunning = false;
/**
 * @return{boolena}
 */
exports.SixRooms = function () {
    if (isRunning) {
        return false;
    } else {
        isRunning = true;
        sub();
        return true;
    }
};

myEvents.on('start', function () {
    // rule.second = times;
    // for (var i = 0; i < 60; i = i + 3) {
    //     times.push(i);
    // }
    // schedule.scheduleJob(rule, function () {
    // setTimeout(function () {
        SixRoomscrawler.getMainData();

    // },60000);
    console.log('-------------爬完啦----------------');
    myEvents.emit('updateOther');

    // });
});

myEvents.on('updateOther', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 5) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (SixRoomscrawler.updateFans()) {
            this.cancel();
            console.log('------------更新完了---------------');
            isRunning = false;
            var Today = new Date();
            var NowHour = Today.getHours();
            var NowMinute = Today.getMinutes();
            var NowSecond = Today.getSeconds();
            var end = (NowHour * 3600) + (NowMinute * 60) + NowSecond;
            console.log('六间房耗时' + end-mypretime);
            myEvents.emit('gameover');
        }
    });
});

myEvents.on('gameover', function () {
    uploadService.uploadServe('sixrooms');
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
