/**
 * Created by deng on 16-6-7.
 */
var cheerio = require('cheerio');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var schedule = require('node-schedule');
var schedule1 = require('node-schedule');
var HuYacrawler = require("../crawler/HuYacrawlerTask.js");
var uploadSerivce = require("../uploadModel/upload.js");
var rule = new schedule.RecurrenceRule();
var rule1 = new schedule1.RecurrenceRule();
var TimeUtils = require("../Utils/TimeUtils");

var times = [];
var times1 = [];
var isRuning = false;
/**
 * @return {boolean}
 */
exports.HuYa = function () {
    TimeUtils.PrintCrruentTime();

    if (isRuning) {
        return false;
    } else {
        isRuning = true;
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
        if (HuYacrawler.getMainData()) {
            this.cancel();
            console.log('----------HuYa-------爬完了-------------------');
            TimeUtils.PrintCrruentTime();

            myEvents.emit('updateOther');
        }
    });
});
myEvents.on('updateOther', function () {
    rule1.second = times1;
    for (var i = 0; i < 60; i = i + 6) {
        times1.push(i);
    }
    schedule1.scheduleJob(rule1, function () {
        if (HuYacrawler.UpdateTags()) {
            this.cancel();
            console.log('----------HuYa-------更新完了-------------------');
            TimeUtils.PrintCrruentTime();

            isRuning = false;
            myEvents.emit('gameover')
        }
    });
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
    // // myEvents.emit('gameover')
    // myEvents.emit('updateOther');
}
myEvents.on('gameover', function () {
    uploadSerivce.uploadServe('huya');
});