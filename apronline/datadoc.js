const { json } = require('body-parser');
var express = require('express');
var router = express.Router();
var fs = require('fs');
const { async } = require('rxjs');
const moment = require('moment');
var pool = require('./connectdb').pool;
router.get('/:id', async (req, res) => {
    /* ข้อมูลผูอนุมัติ */
    var dataDoc = [];
    let id = req.params.id;
    getPool("apk_apronline")
    pool.getConnection(async (err, conn) => {
        if (err) {
            return console.log(err)
        }
        pool.query('SELECT * FROM datadoc WHERE id=? AND st_del is null', [id], async (err, rows) => {
            if (err) {
                return console.error(err);
            }
            else {
                if (rows.length > 0) {

                    var dataApr = await JSON.parse(rows[0].apr_)
                    var topic = await (rows[0].topic)
                    var file = await JSON.parse(rows[0].fileup)
                    var dataemploy = await getDataemploy(rows[0].idcard);
                    var createdoc = await JSON.parse(rows[0].datakey);
                    var comment = await JSON.parse(rows[0].comment);
                    var statustem = await (rows[0].statustem);
                    var idcard=await (rows[0].idcard);
                    var datatypedoc=await JSON.parse(rows[0].datatypedoc);
                    var template_eng=await (rows[0].template_eng);
                    var datatemplate=await JSON.parse(rows[0].datatemplate);
                    
                    //console.log(createdoc)
                    dataDoc.push({
                        "apr_": dataApr,
                        "topic": topic,
                        "fullname": dataemploy.fullname,
                        "file": file,
                        "datakey": createdoc,
                        "comment" : comment,
                        "statustem" : statustem,
                        "idcard" : idcard,
                        "datatypedoc" : datatypedoc,
                        "template_eng" : template_eng,
                        "datatemplate" : datatemplate
                    })
                   // console.log(dataDoc)
                    res.status(200).json({ status: true, dataDoc });
                    res.end();
                }
                else {
                    res.status(200).json({ status: false, dataDoc });
                    res.end();
                }
            }
        });
        conn.release();

    });

});

router.post('/canceldoc/:fullname', async (req, res) => {
    console.log(req.body)
    getPool("apk_apronline");
    let fullname = req.params.fullname;
    let id=req.body.data;
    let detail=req.body.detailncanceldoc;
    let datalog=await getDatadoc(id,fullname);
    pool.getConnection(async (err, conn) => {
        if (err) {
            return console.log(err)
        }
        else{
          let  datadel = [
                {
                    "st_del": "ลบข้อมูล",
                    "remark": detail
                }
            ];
            pool.query("UPDATE datadoc SET st_del = ?,datalog=? WHERE id =?", [JSON.stringify(datadel),JSON.stringify(datalog),id], (err2, result) => {
                if (err2 != null) {
                    return console.error(err2);
                } else {
                    res.status(200).json({ status: true, message: 'ทำการลบข้อมูลเรียบร้อยแล้วค่ะ' })
                    res.end();
                    conn.release();
                }
            });
        }
      
    });
   
});
router.get('/canceldoc/:id', async (req, res) => {
    getPool("apk_apronline")
    //console.log(poolCon)
    let id = req.params.id;
    pool.getConnection(async (err, conn) => {
        if (err) {
            return console.log(err)
        }
        pool.query("UPDATE datadoc SET st_del = 0 WHERE id =?", [id], (err2, result) => {
            if (err2 != null) {
                return console.error(err2);
            } else {
                res.status(200).json({ status: true, message: 'ทำการลบข้อมูลเรียบร้อยแล้วค่ะ' })
                res.end();
            }
        });
        conn.release();
    });
});


router.get('/file/:name', async (req, res) => {

    try {
        let name = req.params.name;
        var filename = './uploads/' + name;
        var data = fs.readFileSync(filename)
        // res.contentType('application/pdf');
        res.send(data)
    } catch (error) {

    }



});

async function getDatadoc(id,fullname) {
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        pool.getConnection(async (err, conn) => {
            if(err) console.log(err)
            pool.query({ sql: 'select datalog from datadoc WHERE id=?', timeout: 60000 }, [id], (err, doc) => {
                // return doc[0];
                if (err) {
                    return console.error(err);
                } else {
                    let datalog = [];
                    datalog=JSON.parse(doc[0].datalog);
                    datalog.push({
                        "st_": "ลบเอกสาร",
                        "datelog": moment().format('DD/MM/YYYY-HH:mm:ss'),
                        "fullname": fullname
                    })
                    resolve(datalog);

                }

            });
            // console.log(employ)
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
                        username: doc[0].username
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