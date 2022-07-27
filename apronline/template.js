var express = require('express');
var router = express.Router();
//var mysql = require('mysql');
var bcrypt = require('bcryptjs');
var pool = require('./connectdb').pool;
// var pool = mysql.createPool({
//     poolSize: 4,
//     host: '192.168.0.100',
//     user: 'intranet_apk',
//     password: '@apk2015',
//     database: 'apk_apronline'
// });


router.get('/delete/:id', async (req, res) => {
    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {

        if (err) {
            return console.error(err);
        } else {
            let id=req.params.id;
            pool.query("UPDATE templatedoc SET st_del = 0 WHERE id =?",[id], (err2, result) => {
            
              
                // log error's to console
                if (err != null) {
                    return console.error(err);
                } else {
                    res.status(200).json({ status:true,message : 'ทำการลบข้อมูลเรียบร้อยแล้วค่ะ','data':id})
                }
              });
              conn.release();
        }
    });
  
})


router.get('/:id', async (req, res) => {

   
    //console.log(id)
    getPool("apk_apronline");
      pool.getConnection(async (err, conn) => {
        let id=req.params.id;
       
      
        try {
             pool.query('SELECT * FROM templatedoc WHERE id=?',[id], (err, result) => {
               
                if (err != null) {
                    console.log('Query ' + err)
                }
                else {
                    res.status(200).json({ data : result[0]})
                    res.end();
                }
            });
           
          } catch (err) {
            console.log('Database ' + err)
          }
          conn.release();
    });
});

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

module.exports = router;
