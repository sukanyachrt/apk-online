
var express = require('express');
var router = express.Router();
var pool = require('./connectdb').pool;
var fs = require('fs');
var path = require('path');
const moment = require('moment');
router.post('/rejectapr/:idcard/', async (req, res) => {
    let idcard = req.params.idcard;
    let databody=req.body
    console.log(databody)
    var dataemploy = await getDataemploy(idcard);
    var datadoc = await getDatatemplate(databody.data.datadoc_id,Number(databody.data.role_apr),databody.detailnoapr,dataemploy.fullname);
    var aprnew = JSON.stringify(datadoc[0].typememo.apr_);
    await updateDoc("รอการแก้ไข", aprnew, databody.data.datadoc_id,JSON.stringify(datadoc[0].comment))
    var stupdateApr = await updateApr(databody.data.idApr, "รอการแก้ไข");
    if(stupdateApr==='รอการแก้ไข'){
        res.status(200).json({ status: true });
        res.end();
    }
   // console.log(datadoc)

   
});

async function updateDoc(statustem, apr_, id,comment) { /*  สถานะเอกสารและข้อมูลการอนุมัติ */
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        var sqldoc = `UPDATE datadoc SET statustem=?,apr_=?,comment=? WHERE id= ?`;
        pool.getConnection(async (err, conn) => {
            pool.query(sqldoc, [statustem, apr_,comment, id], function (err3, res3) {
                if (err3) { throw err3; }
                else {
                    resolve(res3)
                }
                
            });
            conn.release();
        });

    });
}
async function updateApr(idApr, st) { /* update สถานะการอนุมัติ */
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")

        pool.getConnection(async (err, conn) => {
            var sql = `UPDATE apr_datadoc SET st_apr=? WHERE id= ?`;
            pool.query(sql, [st,  idApr], function (err3, res3) {
                if (err3) { throw err3; }
                resolve(st)

            });
            conn.release()
        });
    });
}

async function getDatatemplate(data_doc, role_apr,comment_,fullname) {

    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        pool.getConnection(async (err, conn) => {
            pool.query('SELECT * FROM datadoc WHERE id=? ', [data_doc], async (err, rows) => {
                //console.log(role_apr)
  
                let myArray = JSON.parse(rows[0].apr_)
                myArray[role_apr].st_ = "รอการแก้ไข";
                // myArray[role_apr].fullname = fullname;
                myArray[role_apr].dateApr = moment().format("DD/MM/YYYY") + ' ' + moment().format("HH:mm");
                let comment = [];
               // console.log(rows[0].comment)
                if(JSON.parse(rows[0].comment)==null){
                    
                }
                else{
                 //   console.log("d")
                  comment=(JSON.parse(rows[0].comment));
                }
              
                await  comment.push({
                    comment : comment_,
                    dateApr : moment().format("DD/MM/YYYY") + ' ' + moment().format("HH:mm"),
                    role_apr : role_apr,
                    fullname : fullname
                    })
              //  console.log(comment)
                resolve([
                    {
                        typememo: {
                            "apr_": myArray
                        },
                        data: JSON.parse(rows[0].datatemplate),
                        idcard: [rows[0].idcard],
                        dateKey: JSON.parse(rows[0].datakey).dateKey,
                        template: rows[0].template_eng,
                        referfile: rows[0].referfile,
                        comment :await comment
                    }
                ])
  
  
            });
            conn.release();
        });
    });
  }
  async function getDataemploy(idcard) {
    return new Promise(function (resolve, reject) {
        getPool("login")

        pool.getConnection(async (err, conn) => {
            pool.query({ sql: 'select CONCAT(name," ",lastname) as fullname,username,division as depart,eid as empid,position from data where idcard = ? and probation <> "ลบข้อมูล"', timeout: 60000 }, [idcard], (err, doc) => {
                // return doc[0];
                if (err) {
                    return console.error(err);
                } else {

                    const payload = {
                        fullname: doc[0].fullname,
                        depart: doc[0].depart,
                        position: doc[0].position,
                        username: doc[0].username,

                    };
                    resolve(payload);

                }

            });
            // console.log(employ)
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