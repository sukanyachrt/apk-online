var express = require('express');
var router = express.Router();
var pool = require('./connectdb').pool;



router.get('/status/:status/:idcard', async (req, res) => {
    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {
        if(err) console.log(err)
        let status = req.params.status;
        let idcard = req.params.idcard;
       
        if(status=="all"){
            var sql = "SELECT id,topic,template_name,statustem,datakey,referfile FROM datadoc WHERE st_del is null AND idcard=? ORDER BY id desc";
           
        }
        else{
            var sql = "SELECT id,topic,template_name,statustem,datakey,referfile FROM datadoc WHERE st_del is null AND idcard=? AND statustem=? ORDER BY id desc";
        }
        pool.query(sql, [idcard,status], async function  (err, rows) {
            var dataDoc = [];
            if (rows.length > 0) {
                
                for (i = 0; i < rows.length; i++) {
                   // console.log(JSON.parse(rows[i].topic))
                    dataDoc.push({
                        "noid" : i+1,
                        "id": await rows[i].id,
                        "topic": await JSON.parse(rows[i].topic),
                        "datakey":  JSON.parse(rows[i].datakey),
                        "template_name":  rows[i].template_name,
                        "statustem":  rows[i].statustem,
                        "referfile":  rows[i].referfile,
                        

                    })
                    if (rows.length - 1 == i) {
                        res.status(200).json({ status: true, data: dataDoc });
                        res.end();
                    }
                }
                        
            }
            else{

                res.status(200).json({status : false , msg : "ไม่มีข้อมูล",data:[]})
            }
            
            
        });
        conn.release()
    });
   
});

router.get('/countdoc/:idcard/', async (req, res) => {
   // console.log("sss")
    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {
        if(err) console.log(err)
        let idcard = req.params.idcard;
       // let status=req.body;
        let status= [
              {
                icon: 'list_alt',
                item: "ทั้งหมด",
                text: "all",
                color_icon: "icon-all",
                color_nonti: "nonti-all",
                count : 0
              },
              {
                icon: 'access_time',
                item: "รอการอนุมัติ",
                text: "รอการอนุมัติ",
                color_icon: "icon-Pending",
                color_nonti: "nonti-Pending",
                count : 0
              },
              {
                icon: 'rotate_90_degrees_ccw',
                item: "รอการแก้ไข",
                text: "รอการแก้ไข",
                color_icon: "icon-reject",
                color_nonti: "nonti-reject",
                count : 0
              },
              {
                icon: 'check_box',
                item: "อนุมัติ",
                text: "อนุมัติ",
                color_icon: "icon-approve",
                color_nonti: "nonti-approve",
                count : 0
              },
              {
                icon: 'cancel',
                item: "ไม่อนุมัติ",
                text: "ไม่อนุมัติ",
                color_icon: "icon-noapprove",
                color_nonti: "nonti-noapprove",
                count : 0
              }
            ]
            let statusArry=[];
            status.forEach(element => {
              
                statusArry.push(element.text)
            });
           // console.log(statusArry)
            var sql = "SELECT count(id) as numst, statustem FROM datadoc WHERE st_del is null AND idcard = ? AND statustem IN (?) GROUP BY statustem ORDER BY id desc";
        
            pool.query(sql, [idcard,statusArry], async function  (err, rows) {
            //  console.log(err)
            //  console.log(rows)
            if(err){
                return console.log(err)
            }
            else{
                if(rows.length>0){
                    let sumAll=0;
                    for (i = 0; i < rows.length; i++) {
                        //console.log(rows[i].statustem)
                        index = status.findIndex(x => x.text ===rows[i].statustem);
                        //console.log(index);
                        status[index].count = rows[i].numst;
                        sumAll+=rows[i].numst;
                        if (rows.length - 1 == i) {
                            status[0].count =sumAll;
                            res.status(200).json({ status: true, data: status });
                            res.end();
                        }

                    }
                   

                    // res.status(200).json({ status: true, data: rows });
                    // res.end();
                }
                else{
                    res.status(200).json({ status: false, data: status });
                    res.end();
                }
            }
          
            
        });
        conn.release();
    });
   //res.end();
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