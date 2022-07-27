
var express = require('express');
var router = express.Router();
var pool = require('./connectdb').pool;
var fs = require('fs');
var path = require('path');
const assert = require('assert');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit')
const moment = require('moment');
router.post('/noapr/:idcard/', async (req, res) => {

  let idcard = req.params.idcard;
  let databody=req.body
  //console.log(databody)

  var datadoc = await getDatatemplate(databody.data.datadoc_id,Number(databody.data.role_apr),databody.detailnoapr,idcard);
  var aprnew = JSON.stringify(datadoc[0].typememo.apr_);
  await updateDoc("ไม่อนุมัติ", aprnew, databody.data.datadoc_id,JSON.stringify(datadoc[0].comment))
  var stupdateApr = await updateApr(databody.data.idApr, "ไม่อนุมัติ");
  const namefile = databody.data.referfile;
  assert.notEqual(namefile, null, ERRORS.ARGUMENTS);
  await  run({ namefile }).catch(console.error);

  res.status(200).json({ status: true });

  res.end();
});

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

async function getDatatemplate(data_doc, role_apr,comment_,idcard) {

  return new Promise(function (resolve, reject) {
      getPool("apk_apronline")
      pool.getConnection(async (err, conn) => {
          pool.query('SELECT * FROM datadoc WHERE id=? ', [data_doc], async (err, rows) => {
              //console.log(role_apr)

              let myArray = JSON.parse(rows[0].apr_)
              myArray[role_apr].st_ = "ไม่อนุมัติ";
              myArray[role_apr].dateApr = moment().format("DD/MM/YYYY") + ' ' + moment().format("HH:mm");
              let comment = [];
              if(JSON.parse(rows[0].comment)==null){

              }
              else{
                comment=JSON.parse(rows[0].comment);
              }
              //let comment = JSON.parse(rows[0].comment);
            
              //console.log(comment)
              comment.push({
                comment : comment_,
                dateApr : moment().format("DD/MM/YYYY") + ' ' + moment().format("HH:mm"),
                role_apr : role_apr
              })
              
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
                      comment : comment
                  }
              ])


          });
          conn.release();
      });
  });
}

const run = async ({ namefile }) => {

  const pdfDoc = await PDFDocument.load(fs.readFileSync(path.join(__dirname, '../public/template/' + namefile)));
  pdfDoc.registerFontkit(fontkit);

  const fontBytes = fs.readFileSync(path.join(__dirname, '../public/font/Angsana new font.ttf'));
  const customFont = await pdfDoc.embedFont(fontBytes);
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    let imagePage = '';
    imagePage = pdfDoc.getPage(i);
    let yy = imagePage.getHeight()
    imagePage.drawText('ไม่ผ่านการอนุมัติ', {
      x: 150,
      y: yy / 2,
      font: customFont,
      size: 70,
      rotate: degrees(30),
      lineHeight: 24,
      color: rgb(0.75, 0.2, 0.2),
      opacity: 0.3,
    });
  }
  const pdfBytes = await pdfDoc.save();
  const newFilePath = path.join(__dirname, '../public/template/' + namefile);
  fs.writeFileSync(newFilePath, pdfBytes);
}

const ERRORS = {
  ARGUMENTS: 'Please provide path to the PDF file as a first argument and path to image as the second argument'
};


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