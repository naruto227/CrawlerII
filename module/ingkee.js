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
    for (var i = 0; i < 60; i = i + 5) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (IngKeescrawler.getMainData1()) {
            if(IngKeescrawler.getMainData2()){
                this.cancel();
                console.log('-------ingkee------爬完啦----------------');
                console.log('update ingkee first start');

                myEvents.emit('updateOther');
            }
        }
    });
});

myEvents.on('updateOther', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 9) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (IngKeescrawler.updateOthers()) {
            this.cancel();
            console.log('update ingkee second start');

            myEvents.emit('updateSecond');
        }
    });
});

myEvents.on('updateSecond', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 9) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (IngKeescrawler.updateOthers()) {
            this.cancel();
            console.log('update ingkee third start');

            myEvents.emit('updateThird');
        }
    });
});

myEvents.on('updateThird', function () {
    rule.second = times;
    for (var i = 0; i < 60; i = i + 9) {
        times.push(i);
    }
    schedule.scheduleJob(rule, function () {
        if (IngKeescrawler.updateOthers()) {
            this.cancel();
            console.log('-------ingkee-------更新完了---------------');
            isRunning = false;
            var Today = new Date();
            var NowHour = Today.getHours();
            var NowMinute = Today.getMinutes();
            var NowSecond = Today.getSeconds();
            var end = (NowHour * 3600) + (NowMinute * 60) + NowSecond;
            var time = end - mypretime;
            console.log('花椒耗时' + time);
            myEvents.emit('gameover');
        }
    });
});

myEvents.on('gameover', function () {
    uploadService.uploadServe('ingkee');
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

