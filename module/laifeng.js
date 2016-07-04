/**
 * Created by huang on 16-6-12.
 */
var cheerio = require('cheerio');
// var request = require('request');
var schedule = require('node-schedule');
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var LaiFengcrawler = require("../crawler/LaiFengcrawlerTask.js");
var uploadService = require("../uploadModel/upload.js");
var rule = new schedule.RecurrenceRule();
var rule1 = new schedule.RecurrenceRule();

var times = [];
var isRunning = false;
/**
 * @return{boolean}
 */
exports.laifeng = function () {
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
        if (LaiFengcrawler.getMainData()) {
            this.cancel();
            console.log('------laifeng-------爬完啦----------------');
            myEvents.emit('updateOther');
        }
    });
});

myEvents.on('updateOther', function () {
    rule1.second = times;
    for (var i = 0; i < 60; i = i + 8) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (LaiFengcrawler.updateFans()) {
            this.cancel();
            console.log('------laifeng------更新完了---------------');
            isRunning = false;
            var Today = new Date();
            var NowHour = Today.getHours();
            var NowMinute = Today.getMinutes();
            var NowSecond = Today.getSeconds();
            var end = (NowHour * 3600) + (NowMinute * 60) + NowSecond;
            var time = end - mypretime;
            console.log('来疯耗时:' + time);
            myEvents.emit('gameover');
        }
    });

});

myEvents.on('gameover', function () {
    uploadService.uploadServe('laifeng');
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