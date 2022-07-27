var express = require('express');
var router = express.Router();
const multer = require("multer");
const moment = require('moment');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, moment().format('DDMMYYYYHHmmss')+'-'+Math.floor(Math.random() * 1001)+ path.extname(file.originalname));
  }

});

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/signature");
  },
  filename: function (req, file, cb) {
    console.log(req)
    cb(null, file.originalname+".png");
  }

});

var upload = multer({ storage: storage });
var upload2 = multer({ storage: storage2 });

router.post('/upload', upload.array("files"), async (req, res) => {

  const files = req.files;

  if (Array.isArray(files) && files.length > 0) {
    res.json(req.files);
  } else {
    res.status(400);
    throw new Error("No file");
  }
  res.end()
})


router.post('/uploadsign/:idcard',upload2.single("files"),  async (req, res) => {
  
    console.log(req.file);
   /* */
   
   res.json({ message: "Successfully uploaded files" });
})




module.exports = router;