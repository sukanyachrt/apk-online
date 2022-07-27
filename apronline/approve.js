var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var bcrypt = require('bcryptjs');
const { json } = require('body-parser');
var fs = require('fs');
const moment = require('moment');
var pdf = require('html-pdf');
const { async } = require('rxjs');
const { createCanvas } = require('canvas')
var pool = require('./connectdb').pool;

var options = {
    format: 'A4',
    "quality": "100",
    "border": {

        "bottom": "0.3in",

    },

    paginationOffset: 1,       // Override the initial pagination number

    "footer": {
        "height": "0.5in",
        //  contents: '<b  style="text-align:right">หน้า {{page}} of {{pages}}</b>'
        "contents": "<div style='color: black;text-align:right;'>หน้า {{page}} จาก {{pages}}</div>"
    }


}
router.get('/aprTemplate/:id/:idcard', async (req, res) => { /* ของ user */
    getPool("apk_apronline")
    pool.getConnection(async (err, conn) => {
        if (err) {
            return console.error(err);
        }
        else {
            let id = req.params.id;
            let idcard = req.params.idcard;
            /* ชื่ออนุมัติ */
            var dataApr = [];
            pool.query('SELECT * FROM user_permit WHERE template_id=? AND idcard=? AND st_del is null', [id, idcard], async (err, rows) => {
                if (rows.length > 0) {
                    var aprAll = JSON.parse(rows[0].detailpermit);

                    const roleApr = [];
                    const stApr = [];

                    for (let i = 0; i < aprAll.length; i++) {

                        roleApr[i] = aprAll[i].role;
                        stApr[i] = aprAll[i].st_;

                    }

                    var sql = "SELECT apr_,detail_role,CONCAT(`name`,' ',lastname) as fullname,position FROM apk_apronline.apr_employ INNER JOIN login.`data` ON login.`data`.idcard = apk_apronline.apr_employ.apr_ WHERE apr_employ.idcard=? AND apr_role IN (?) AND st_del is null Order by apr_role asc";
                    pool.query(sql, [idcard, roleApr], function (err, result, fields) {

                        if (err) {
                            console.log(err);
                        }
                        else {




                            result.forEach((element, index) => {
                               
                                dataApr.push({
                                    "apr_": element.apr_,
                                    "role": element.detail_role,
                                    "fullname": element.fullname,
                                    "position": element.position,
                                    "dateApr": '',
                                    "st_": '-',
                                    "signature": '',
                                    "stApr": stApr[index],
                                    "no_apr": roleApr[index]
                                })
                            });

                            res.status(200).json(dataApr)
                            res.end();

                        }
                    })
                }
                else {
                    res.status(404).json(dataApr);
                    res.end();
                }



            });
        }

        conn.release();
    });


});


router.get('/:idcard', async (req, res) => {
    let idcard = req.params.idcard;

    getPool("apk_apronline");
    pool.getConnection(async (err, conn) => {
        pool.query('SELECT topic,datakey,datadoc_id,apr_datadoc.id as id,fullname,depart,referfile,role_apr FROM apr_datadoc INNER JOIN datadoc ON datadoc.id = apr_datadoc.datadoc_id WHERE  apr_datadoc.idcard=? AND apr_datadoc.st_apr="รอการอนุมัติ" AND apr_datadoc.st_del is null AND datadoc.st_del is null GROUP BY datadoc_id,role_apr,apr_datadoc.st_apr', [idcard], async (err, rows) => {
            if (err) {

            }
            else {
                var dataDoc = [];
                //console.log(rows)
                if (rows.length > 0) {
                    for (i = 0; i < rows.length; i++) {
                        dataDoc.push({
                            "datadoc_id": await rows[i].datadoc_id,
                            "id": await rows[i].id,
                            "topic": await JSON.parse(rows[i].topic),
                            "datakey": await JSON.parse(rows[i].datakey),
                            "fullname": await rows[i].fullname,
                            "depart": await rows[i].depart,
                            "referfile": await rows[i].referfile,
                            "role_apr": await rows[i].role_apr,

                        })
                        if (rows.length - 1 == i) {
                            res.status(200).json({ status: true, data: dataDoc });
                            res.end();
                        }
                    }
                }
                else {
                    res.status(200).json({ status: true });
                    res.end();
                }


                //console.log(dataDoc)



            }
        })
        conn.release();
    })


});


router.post('/signOnsystem/:idcard/:typesign', async (req, res) => {

    let data_ = req.body;
    const files = req.files;
  //  console.log(data_)
   // console.log(files)
  
    const idcard = req.params.idcard;
    const typesign=req.params.typesign;
    var datatypesign = await getTypesign(typesign,idcard,Number(data_.role_apr));
    const signimg = datatypesign.signimg;
    if(datatypesign.status==true){
        var datadoc = await getDatatemplate(data_.datadoc_id, signimg, Number(data_.role_apr),typesign);

        var dataemploy = await getDataemploy(datadoc[0].idcard);
        res.render('../template/' + datadoc[0].template, { data: datadoc[0], employ: dataemploy }, function (err, html) {
    
            //console.log(html)
            const nameFile = datadoc[0].referfile
    
            try {
                pdf.create(html, options).toFile('./public/template/' + nameFile, async function (err_, res_) {
                    if (err) { return console.log(err) }
                    else {
    
                        /* update สถานะ ผู้อนุมัติคนที่ sign */
                        var stupdateApr = await updateApr(data_.idApr, "อนุมัติ");
    
                        /* หาผู้อนุมัตคนต่อ */
    
                        let role_next = Number(data_.role_apr) + 1
                        let data_next = await datadoc[0].typememo.apr_[role_next]; // ข้อมูลการอนุมัติคนต่อไป
                        var aprnew = JSON.stringify(datadoc[0].typememo.apr_);
                        if (data_next == "undefined" || data_next == undefined) {
                            /* update สถานะเสร็จสมบูรณ์ */
                            var st = "อนุมัติ";
                            updateDoc(st, aprnew, data_.datadoc_id)
                        }
                        else {
                            var st = "รอการอนุมัติ";   /* update สถานะรอการอนุมัติ */
                            var idcard = datadoc[0].typememo.apr_[role_next].apr_;
                            var stupdateNext = updateNext(data_.datadoc_id, idcard, role_next)
                            updateDoc(st, aprnew, data_.datadoc_id)
                        }
    
    
                        res.status(200).json({ status: true });
                        res.end()
                    }
                });
            } catch (error) {
                console.log("approve" + error)
            }
    
        });
    }
    else{
        res.status(200).json({ status: false, msg: datatypesign.msg });
        res.end()
    }
   



});


router.get('/countNonti/:idcard', async (req, res) => {
    //console.log(req.params.idcard);
    getPool("apk_apronline")
    pool.getConnection(async (err, conn) => {
        var idcard=req.params.idcard;
        pool.query('SELECT topic,datakey,datadoc_id,apr_datadoc.id as id,fullname,depart,referfile,role_apr FROM apr_datadoc INNER JOIN datadoc ON datadoc.id = apr_datadoc.datadoc_id WHERE  apr_datadoc.idcard=? AND apr_datadoc.st_apr="รอการอนุมัติ" AND apr_datadoc.st_del is null AND datadoc.st_del is null GROUP BY datadoc_id,role_apr,apr_datadoc.st_apr', [idcard], async (err, rows) => {
            if (err) {

            }
            else {
                
                if(rows.length>0){
                   
                    res.status(200).json({ status: true, data: rows.length });
                    res.end();
                }
                else{
                    res.status(200).json({ status: true, data: 0 });
                    res.end();
                }
               
            }
        });
        conn.release();
    });
   // res.end()
})

async function getTypesign(typesign,idcard,role) {
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        pool.getConnection(async (err, conn) => {
                if(typesign=='signonsystem'){
                    pool.query('SELECT signature FROM signature WHERE idcard=? AND typesign=? AND  st_del is null ORDER BY id desc', [idcard,typesign], async (err, rowsingn) => {
                        if (err) {
                             resolve({ status: false, msg: err });
                        }
                        else {
                            if (rowsingn.length > 0) {
                                const signimg = rowsingn[0].signature
                                resolve({ status: true, signimg: signimg });
                            }
                            else{
                                resolve({ status: false, msg: "ยังไม่มีลายเซนต์ในระบบ โปรดใช้ฟังก์ชั่นอื่น" });
                            }
                        }
                    });
                }
                else if(typesign=='signname'){

                    var dataemploy= await  getDataemploy(idcard);
                    const width = 900
                    const height = 450
                    const canvas = createCanvas(width, height);
                    const context = canvas.getContext("2d");
                    context.fillStyle = "#fff";
                    context.fillRect(0, 0, width, height);
                
                    context.fillStyle = "#000";
                    context.font = "bold 150px Angsana New";
                    context.textAlign = "center";
                    context.fillText(dataemploy.fullname, 450, 400,800);
                    const buffer = canvas.toBuffer("image/png", { quality: 1 });
                    fs.writeFileSync("./public/signature/"+idcard+"-name.png", buffer);
                    const signimg = idcard+"-name.png"
                    resolve({ status: true, signimg: signimg });
                    
                }
                else if(typesign=='upload'){
                    const signimg = idcard+".png";
                    resolve({ status: true, signimg: signimg });
                }
                else{
                    resolve({ status: false });
                }
           

            conn.release();
        });
    });

};

async function getDatatemplate(data_doc, sign, role_apr,typesign) {

    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        pool.getConnection(async (err, conn) => {
            pool.query('SELECT * FROM datadoc WHERE id=? ', [data_doc], async (err, rows) => {
                // console.log(JSON.parse(rows[0].apr_))
                let myArray = JSON.parse(rows[0].apr_)


                myArray[role_apr].signature = "http://localhost:3006/api/v1/image/sign/" + sign
                myArray[role_apr].st_ = "อนุมัติ";
                myArray[role_apr].typesign = typesign;
                myArray[role_apr].dateApr = moment().format("DD/MM/YYYY") + ' ' + moment().format("HH:mm");


                resolve([
                    {
                        typememo: {
                            "apr_": myArray
                        },
                        data: JSON.parse(rows[0].datatemplate),
                        idcard: [rows[0].idcard],
                        dateKey: JSON.parse(rows[0].datakey).dateKey,
                        template: rows[0].template_eng,
                        referfile: rows[0].referfile
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

async function updateApr(idApr, st) { /* update สถานะการอนุมัติ */
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")

        pool.getConnection(async (err, conn) => {

            var sql = `UPDATE apr_datadoc SET st_apr=? WHERE id= ?`;
            pool.query(sql, [st, idApr], function (err3, res3) {
                if (err3) { throw err3; }
                resolve(st)

            });
            conn.release()
        });
    });
}

async function updateNext(datadoc_id, idcard, role_next) { /*  ผู้อนุมัติคนต่อไป */
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        var cmd = 'INSERT INTO apr_datadoc (datadoc_id,idcard,st_apr,role_apr) VALUES (?,?,?,?)';
        pool.getConnection(async (err, conn) => {

            pool.query(cmd, [datadoc_id, idcard, "รอการอนุมัติ", role_next], function (err4, res4) {
                if (err4) {
                    console.log(err4);
                }
                else {
                    resolve(res4.insertId)
                }
            });
            conn.release()
        });

    });
}

async function updateDoc(statustem, apr_, id) { /*  สถานะเอกสารและข้อมูลการอนุมัติ */
    return new Promise(function (resolve, reject) {
        getPool("apk_apronline")
        var sqldoc = `UPDATE datadoc SET statustem=?,apr_=? WHERE id= ?`;
        pool.getConnection(async (err, conn) => {
            pool.query(sqldoc, [statustem, apr_, id], function (err3, res3) {
                if (err3) { throw err3; }
                else {
                    resolve(res3)
                }
                //console.log(data.affectedRows)

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