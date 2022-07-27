var express = require('express');
var router = express.Router();
var fs = require('fs');

router.get('/:img', async (req, res) => {
    let img=req.params.img;

    fs.readFile('./public/image/'+img, function (err, data) {
        if (err) throw err;
        res.writeHead(200, {'Content-Type': 'image/jpeg'});
        res.end(data);
    });

   
    
});

router.get('/sign/:img', async (req, res) => {
    let img=req.params.img;

    fs.readFile('./public/signature/'+img, function (err, data) {
        if (err) 
        {
            try {
                
            } catch (error) {
                
            }
            res.end();
           
        }
        else{
            res.writeHead(200, {'Content-Type': 'image/jpeg'});
            res.end(data);
        }
       
    });

   
    
});

module.exports = router;