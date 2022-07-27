var express = require('express');
var router = express.Router();
var pool = require('./connectdb').pool;

var fs = require('fs');
//var mysql = require('mysql');

// var pool = mysql.createPool({
//     poolSize: 4,
//     host: '192.168.0.100',
//     user: 'intranet_apk',
//     password: '@apk2015',
//     database: 'apk_apronline'
// });


router.get('/:id', async (req, res) => {
    getPool("apk_apronline");
     pool.getConnection(async (err, conn) => {

        if (err) {
            return console.error(err);
        } else {
            let id=req.params.id;
                     pool.query('SELECT name_component FROM templatedoc WHERE id=?',[id], (err, result) => {
                     
                        if (err != null) {
                            return console.error(err);
                        } else {
                            var filename='./src/'+result[0].name_component;
                            var data = fs.readFileSync(filename)
                            res.contentType('application/pdf');
                            res.send(data)
                            
                        }
                    });
                    conn.release()
        }
    });
   

})
function getPool(database_name) {
    pool.config.connectionConfig.multipleStatements = false;
    if (database_name) {
        pool.config.connectionConfig.database = database_name;
        return pool;
    }
    else {
        delete pool.config.connectionConfig.database;
        return pool;
    }
}
//console.log("ee")



// module.exports = router;

module.exports = router;