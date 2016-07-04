/**
 * Created by deng on 16-6-21.
 */
exports.PrintCrruentTime = function () {
    var date = new Date();

    var month = date.getMonth() + 1;
    console.log(date.getFullYear() + '年' +
        date.getFullYear() + '年' +
        month+ '月' +
        date.getDate() + '号' +
        date.getHours() + '时' +
        date.getMinutes() + '分' +
        date.getSeconds() + '秒'
    )
};
/**
 * @return {number}
 */
exports.GetCrruentMilliTime = function () {
    var date = new Date();
    return date.getMilliseconds();
};