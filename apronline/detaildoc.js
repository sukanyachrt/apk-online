const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var fs = require('fs');
const { async } = require('rxjs');
var pool = require('./connectdb').pool;

let detailstatus = [
    {

        item: "เอกสารรอการอนุมัติ",
        count : 0
    },
    {
        item: "รายละเอียด",
        count : 0
    },
    {
        item: "สายการอนุมัติ",
        count: 0
    },
    {
        item: "ความคิดเห็น",
        count: 0
    },
    {
        item: "ไฟล์แนบ",
        count: 0
    },


];
router.get('/countdetail/:id', async (req, res) => {
    //console.log(req.params.id);
    let id = req.params.id;


    let count =  await countDetail(id);
    //console.log(count)
    if(count.status===false){
        res.status(200).json({data: count});
    }
    else{
        res.status(200).json({ status: true, data: count });
    }
  
    res.end()
});


async function countDetail(id) {
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline");
        pool.getConnection(async (err, conn) => {
            var sql = "SELECT apr_,comment,fileup  FROM datadoc  WHERE id=?";

            pool.query(sql, [id], async function (err, rows) {
                //  console.log(err)
                //  console.log(rows)
                if (err) {
                    return console.log(err)
                }
                else {
                    if(rows.length>0){
                        let apr_ = await JSON.parse(rows[0].apr_).length;
                        if (JSON.parse(rows[0].comment) != null) {
                            let comment = await JSON.parse(rows[0].comment).length;
                            detailstatus[3].count =await comment;
                            console.log(detailstatus[3])
                        }
                        else{
                            detailstatus[3].count = 0;
                        }
                        if (JSON.parse(rows[0].fileup) != null) {
                            let fileup = await JSON.parse(rows[0].fileup).length;
                            //console.log(fileup)
                            detailstatus[4].count = await fileup;
                        }
                        else{
                            detailstatus[4].count =0;
                        }
                        detailstatus[2].count = await apr_;
                        resolve(detailstatus);
                    }
                    else{
                        resolve({status : false,msg: "ไม่สามารถเข้าถึงข้อมูลได้ !"});
                    }

                    
                    //console.log(detailstatus)
                }
            });
            conn.release();
        });
    });
}


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