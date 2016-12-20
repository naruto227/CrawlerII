/**
 * Created by deng on 16-6-7.
 */
var cheerio = require('cheerio');
var request = require('request');
var EventEmitter = require('events').EventEmitter;
var myEvents = new EventEmitter();
var schedule = require('node-schedule');
var schedule1 = require('node-schedule');
var DouYucrawler = require("../crawler/DouYucrawlerTask.js");
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
exports.DouYu = function () {
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
    for (var i = 0; i < 60; i = i + 5) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (DouYucrawler.getMainData()) {
            this.cancel();
            console.log('-------DouYu----------爬完了-------------------');
            TimeUtils.PrintCrruentTime();

            myEvents.emit('gameover');
        }
    });
});
// myEvents.on('updateOther',function () {
//     rule1.second = times1;
//     for (var i = 0; i < 60; i = i + 10) {
//         times1.push(i);
//     }
//     schedule1.scheduleJob(rule1, function () {
//         if (DouYucrawler.UpTags()) {
//             this.cancel();
//             console.log('-----------------更新完了-------------------');
//             myEvents.emit('gameover');
//             isRuning = false;
//         }
//     });
// });

myEvents.on('gameover', function () {
    uploadSerivce.uploadServe('douyu');
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