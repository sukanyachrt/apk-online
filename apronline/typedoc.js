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

router.get('/list', async (req, res) => {

    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {

        if (err) {
            return console.error(err);
        } else {

            pool.query('SELECT t.id,t.id_type, t.name_type, (SELECT COUNT(*) FROM templatedoc WHERE id_typedoc = t.id AND st_del is NULL) numTemplate  FROM typedoc t where t.st_del is NULL', (err, rows) => {
            
                if (err) {
                    return console.error(err);
                }
                else {
                    res.status(200).json({ data: rows });
                    res.end();
                    conn.release();
                }
            });

        }
    });

});

router.get('/:id', async (req, res) => {

   
    //console.log(id)
    getPool("apk_apronline");
      pool.getConnection(async (err, conn) => {
        var data={};
        if (err) {
            return console.error(err);
        } else {
            let id=req.params.id;
              pool.query('SELECT t.id,t.id_type, t.name_type, (SELECT COUNT(*) FROM templatedoc WHERE id_typedoc = t.id AND st_del is NULL ) numTemplate  FROM typedoc t where id=? ',[id], async(err, rows) => {
              //  res.status(200).json(rows);
                if(err){
                    return console.error(err);
                }
                else{
                  
                    if(rows.length>0){
                        data.typedoc=rows[0];
                       // const template = await pool.query('SELECT * FROM templatedoc WHERE id_typedoc = ?', [id]);
                        pool.query('SELECT * FROM templatedoc WHERE id_typedoc=? AND st_del is null ORDER BY id DESC',[id], async (err, rowsTem) => {
                           
                            //template=rowsTem;
                           // template.push(rowsTem)
                            data.templatedoc=rowsTem;
                           // console.log(data)
                          // console.log(data)
                           res.status(200).json(data);
                           res.end();
                           
                       });
                      
                    }
                  
                   

                }
            });
        }
        conn.release();
    });

  
});

router.get('/delete/:id', async (req, res) => {
    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {

        if (err) {
            return console.error(err);
        } else {
            let id=req.params.id;
            pool.query("UPDATE typedoc SET st_del = 0 WHERE id =?",[id], (err2, result) => {
            
              
                // log error's to console
                if (err != null) {
                    return console.error(err);
                } else {
                    res.status(200).json({ status:true,message : 'ทำการลบข้อมูลเรียบร้อยแล้วค่ะ','data':id})
                    res.end();
                }
              });
            
        }
        conn.release();
    });
  
})

router.post('/add',async (req,res) => {
    getPool("apk_apronline");
    pool.getConnection((err,conn) => {
        if(err) {
            return console.error(err);
        }else{
            const typedoc=req.body;
            //console.log(typedoc)
            var sql = "INSERT INTO typedoc (id_type, name_type,date_insert,name_insert) VALUES ?;";
            var values = [
                [typedoc.id_type, typedoc.name_type,'',typedoc.idcard],
               
            ];
            pool.query(sql, [values], function (err, result) {
                if (err) throw err;
                res.status(200).json({message: 'บันทึกข้อมูลเรียบร้อยแล้วค่ะ !',id : result.insertId})
                res.end();
                //console.log("Number of records inserted: " + result.insertId);
            });
           
           
        }
        conn.release();
    });
    
  
    
});

router.put('/update/:id', async (req, res) => {
    getPool("apk_apronline");
  await  pool.getConnection(async (err, conn) => {

        if (err) {
            return console.error(err);
        } else {
            let id=req.params.id;
            const typedoc=req.body;

            var updateData=req.body;
            var sql = `UPDATE typedoc SET id_type=?,name_type=? WHERE id= ?`;
            await   pool.query(sql, [updateData.id_type,updateData.name_type, id], function (err, data) {
                if (err) throw err;
                //console.log(data.affectedRows)
                res.status(200).json({message: 'แก้ไขข้อมูลเรียบร้อยแล้วค่ะ !',id : id})
                res.end();
            });
        }
        conn.release();
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


module.exports = router;
