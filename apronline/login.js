var express=require('express');
var router=express.Router();
//var mysql=require('mysql');
var bcrypt = require('bcryptjs');
var pool = require('./connectdb').pool;
// var pool=mysql.createPool({
//     host:'192.168.0.100',
//     user:'intranet_apk',
//     password:'@apk2015',
//     database:'login'
// });

router.post('/login',(req,res) => {
    getPool("login");
    pool.getConnection((err,conn) => {
        if(err) {
            return console.error(err);
        }else{
            const {username,password} = req.body;
            pool.query({sql: 'select role,password,CONCAT(name," ",lastname) as fullname,division as depart,eid as empid,idcard,aprOnline from data where username = ? and probation <> "ลบข้อมูล"',timeout:60000},[username],(err,doc,field) => {
                if(err) {
                    return console.error(err);
                }else{
                    if(doc.length > 0){
                        
                        


                        const isValidPassword = bcrypt.compareSync(password, doc[0].password);
                        if(isValidPassword){
                            const payload = {
                                id: doc[0].id,
                                username: username,
                                idcard: doc[0].idcard,
                                fullname: doc[0].fullname,
                                depart: doc[0].depart,
                                permit : doc[0].aprOnline,
                                role : doc[0].role
                              };
                            
                            
                            res.status(200).json({status:true,data_:payload,message:'login สำเร็จ'});

                        }else{
                            res.status(200).json({status: false,message: 'รหัสผ่านไม่ถูกต้อง'});
                        }
                    }else{
                        res.status(200).json({status: false, message: 'ไม่พบรหัสผู้ใช้นี้'});
                    }
                    conn.release();
                }
            });
        }
    });
});

router.get('/login',(req,res) => {
    console.log("getlogin");
    res.end();
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


module.exports=router;
