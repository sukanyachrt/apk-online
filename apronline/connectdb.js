var mysql = require('mysql');

var pool  = mysql.createPool({
    host: '192.168.0.100',
    user: 'intranet_apk',
    password: '@apk2015',
    database: 'apk_apronline',
});

exports.pool = pool;