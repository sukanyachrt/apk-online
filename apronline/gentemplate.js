var express = require('express');
var router = express.Router();
var fs = require('fs');
const path = require('path');
var pdf = require('html-pdf');
const { async } = require('rxjs');
var pool = require('./connectdb').pool;
const moment = require('moment');
var imgSrc = './public/image/logoicon.jpg';
var options = {
    format: 'A4',
    "quality": "100",
    "border": {
        "bottom": "0",
    },
    "directory": "/tmp",
    paginationOffset: 1,       // Override the initial pagination number
    "header": {
        "height": "25mm",
        "margin-bottom": "5mm",
        // "contents": '<div style="text-align: center;"><img src="https://www.apkgroup.co.th/intranet/api/logoicon.jpg"/></div>'
    },

    "footer": {
        "height": "0.5in",
        "contents": "<div style='color: black;text-align:right;'>หน้า {{page}} จาก {{pages}}</div>"
    }


}

var result = "<div id='pageHeader'><img src='" + imgSrc + "' /><div style='text-align: center;'>Author: Marc Bachmann</div></div>";
result += "<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>";

router.post('/preview/:name', async (req, res) => {
    let name = req.params.name;



    var data = req.body;
    console.log(data)
    var idcard = data[0].idcard;

    var dataemploy = await getDataemploy(idcard);
    // getPool("apk_apronline")
    res.render('../template/' + name, { data: data[0], employ: dataemploy, imgsrc: imgSrc }, function (err, html) {
        //console.log(html)
        try {

            pdf.create(html, options).toFile('./public/template/' + idcard + '.pdf', function (err_, res_) {


                if (err) { return console.log(err) }
                else {
                    var filename = idcard + '.pdf';

                    res.status(200).json(filename)
                    res.end();
                }
            });
        } catch (error) {
            console.log(error)
        }

    });



});

router.post('/create/:name', async (req, res) => {
    let name = req.params.name;
    var data = req.body;
    var idcard = data[0].idcard;
    var dataemploy = await getDataemploy(idcard);
    console.log(data)
    // res.end();
    getPool("apk_apronline")
    pool.getConnection(async (err, conn) => {
        res.render('../template/' + name, { data: data[0], employ: dataemploy }, function (err, html) {


            const nameFile = dataemploy.username + '_' + moment().format('DDMMYYYY-HHmmss') + '.pdf';

            try {
                pdf.create(html, options).toFile('./public/template/' + nameFile, function (err_, res_) {
                    if (err) { return console.log(err) }
                    else {
                        /* insert */
                        var dataK = { "dateKey": moment().format("DD/MM/YYYY"), "timeKey": moment().format("HH:mm") };
                        var topic = JSON.stringify(data[0].data.title);
                        var datatemplate = JSON.stringify(data[0].data);
                        var apr_ = JSON.stringify(data[0].typememo.apr_);

                        var fileup = JSON.stringify(data[0].file);
                        var datakey = JSON.stringify(dataK);


                        var typedoc_name = data[0].typememo.typedocname;
                        var template_name = data[0].typememo.typetemname;
                        var datatypedoc = JSON.stringify(data[0].typememo);
                        // console.log(data[0].typememo.apr_[0].apr_)

                        /* ข้อมูลเอกสาร */
                        let datalog = [{
                            "st_": "สร้างเอกสาร",
                            "datelog": moment().format('DD/MM/YYYY-HH:mm:ss'),
                            "fullname": dataemploy.fullname
                        }]
                        var cmd = 'INSERT INTO datadoc (idcard,topic,typedoc_name,datatemplate,apr_,referfile,template_name,fileup,datakey,statustem,fullname,depart,template_eng,datatypedoc,datalog) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)';
                        pool.query(cmd, [idcard, topic, typedoc_name, datatemplate, apr_, nameFile, template_name, fileup, datakey, "รอการอนุมัติ", dataemploy.fullname, dataemploy.depart, name, datatypedoc, JSON.stringify(datalog)], function (err, result) {
                            if (err) {
                                console.log(err);
                            }
                            else {

                                /* ข้อมูลผู้อนุมัติที่รอ */
                                if (result.insertId > 0) {

                                    var idcardApr = data[0].typememo.apr_[0].apr_;
                                    var cmd_apr = 'INSERT INTO apr_datadoc (datadoc_id,idcard,st_apr,role_apr) VALUES (?, ?, ?, ?)';
                                    pool.query(cmd_apr, [result.insertId, idcardApr, "รอการอนุมัติ", 0], function (err2, result2) {
                                        if (err2) {
                                            console.log(err);
                                        }
                                        else {
                                            res.status(200).json({ status: true, file: nameFile, id: result.insertId })
                                            res.end();
                                        }

                                    });
                                }




                            }


                        });


                    }
                });
            } catch (error) {

            }

        });
        conn.release();
    });

});

router.post('/update/:name/:id/:statustem', async (req, res) => {
   // console.log(req.params.name)
    //console.log("ddd")
    let id = req.params.id;
    let statustem = req.params.statustem;
    let name = req.params.name;
    var data = req.body;
    var idcard = data[0].idcard;
    var dataemploy = await getDataemploy(idcard);
   // console.log(statustem)

    /* แจ้งเตือนผู้ที่เกี่ยวข้อง */
    let datalog=await getDatadoc(id,dataemploy.fullname);
    console.log(datalog)
    let datadel=[];
    if (statustem === 'รอการแก้ไข') {
        /* ยกเลิกเอกสารเดิม และ สร้างเอกสารใหม่ */

         datadel = [
            {
                "st_del": "reject",
                "remark": ""
            }
        ];
    }
    else {

        /* ใช้เลขที่เอกสารเดิม */
         datadel = [
            {
                "st_del": "ขอแก้ไข",
                "remark": "ขอแก้ไข"
            }
        ];

    }


        // let datalog = [{
        //     "st_": "แก้ไขเอกสาร",
        //     "datelog": moment().format('DD/MM/YYYY-HH:mm:ss'),
        //     "fullname": dataemploy.fullname
        // }];

        
        getPool("apk_apronline")
        pool.getConnection(async (err, conn) => {
            pool.query("UPDATE datadoc SET st_del = ? WHERE id =?", [JSON.stringify(datadel), id], (err2, result) => {
                if (err2 != null) {
                    return console.error(err2);
                }
                else {

                    res.render('../template/' + name, { data: data[0], employ: dataemploy }, function (err, html) {


                        const nameFile = dataemploy.username + '_' + moment().format('DDMMYYYY-HHmmss') + '.pdf';

                        try {
                            pdf.create(html, options).toFile('./public/template/' + nameFile, function (err_, res_) {
                                if (err) { return console.log(err) }
                                else {
                                    /* insert */
                                    var dataK = { "dateKey": moment().format("DD/MM/YYYY"), "timeKey": moment().format("HH:mm") };
                                    var topic = JSON.stringify(data[0].data.title);
                                    var datatemplate = JSON.stringify(data[0].data);
                                    var apr_ = JSON.stringify(data[0].typememo.apr_);

                                    var fileup = JSON.stringify(data[0].file);
                                    var datakey = JSON.stringify(dataK);


                                    var typedoc_name = data[0].typememo.typedocname;
                                    var template_name = data[0].typememo.typetemname;
                                    var datatypedoc = JSON.stringify(data[0].typememo);

                                    /* ข้อมูลเอกสาร */
                                    let datalog = [{
                                        "st_": "สร้างเอกสาร",
                                        "datelog": moment().format('DD/MM/YYYY-HH:mm:ss'),
                                        "fullname": dataemploy.fullname
                                    }]
                                    var cmd = 'INSERT INTO datadoc (idcard,topic,typedoc_name,datatemplate,apr_,referfile,template_name,fileup,datakey,statustem,fullname,depart,template_eng,datatypedoc,referdoc,datalog) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)';
                                    pool.query(cmd, [idcard, topic, typedoc_name, datatemplate, apr_, nameFile, template_name, fileup, datakey, "รอการอนุมัติ", dataemploy.fullname, dataemploy.depart, name, datatypedoc, id, JSON.stringify(datalog)], function (err, result) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        else {

                                            /* ข้อมูลผู้อนุมัติที่รอ */
                                            if (result.insertId > 0) {

                                                var idcardApr = data[0].typememo.apr_[0].apr_;
                                                var cmd_apr = 'INSERT INTO apr_datadoc (datadoc_id,idcard,st_apr,role_apr) VALUES (?, ?, ?, ?)';
                                                pool.query(cmd_apr, [result.insertId, idcardApr, "รอการอนุมัติ", 0], function (err2, result2) {
                                                    if (err2) {
                                                        console.log(err);
                                                    }
                                                    else {
                                                        res.status(200).json({ status: true, file: nameFile, id: result.insertId })
                                                        res.end();
                                                    }

                                                });
                                            }




                                        }


                                    });


                                }
                            });
                        } catch (error) {

                        }

                    });

                }
            });

            conn.release();
        });


    


});

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
                        // img:signimg
                    };
                    resolve(payload);

                }

            });
            // console.log(employ)
            conn.release();
        });
    });


}

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
                        "st_": "แก้ไขเอกสาร",
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


router.get('/:name', async (req, res) => {
    try {
        let name = req.params.name;
        var filename = './public/template/' + name;
        var data = fs.readFileSync(filename)
        res.contentType('application/pdf');
        res.send(data)
    } catch (error) {

    }

});

module.exports = router;

