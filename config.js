/**
 * Created by huangzq on 16-06-11
 */
var path = require('path');

var config = {
    //debug 为 true 时，用于本地调试
    debug: true,

    upload: {
        path: path.join(__dirname, 'public/images/'),
        url: '/public/upload/'
    },

    db: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'douyu',
        port: 3306
    }
};


module.exports = config;