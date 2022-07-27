// var express = require('express')
// var bodyParser = require('body-parser')
// var request = require('request')
// var app = express()

// app.use(bodyParser.json())

// app.set('port', (process.env.PORT || 4000))
// app.use(bodyParser.urlencoded({extended: true}))
// app.use(bodyParser.json())
var express = require('express');
var router = express.Router();
router.get('/webhook4', (req, res) => {
    res.send("dddd")
});
router.post('/webhook', (req, res) => {
   var text = req.body.events[0].message.text
   var sender = req.body.events[0].source.userId
   var replyToken = req.body.events[0].replyToken

//   var text = "สวัสดี";
//   var sender = "U1c6abbc75207b9cf3c7d56cefcbaa532";
//   var replyToken = "R4F/6zJiDoAJTeWZQXr5QlbFu0AkKfr3jn9FfMAWjwM6zD6ctTXP0aZ2uvU9RcTWZq03NGkkEd+Y+j43KLZ8/tCk6tadb+fPwWAevyWStXuCnspIXsaUkBr0tNJ1zGKkG307okSBzxoL7N2VuDBJAQdB04t89/1O/w1cDnyilFU="


  console.log(text, sender, replyToken)
  console.log(typeof sender, typeof text)
  // console.log(req.body.events[0])
  if (text === 'สวัสดี' || text === 'Hello' || text === 'hello') {
    sendText(sender, text)
  }
  res.sendStatus(200)
})

function sendText (sender, text) {
  let data = {
    to: "U1c6abbc75207b9cf3c7d56cefcbaa532",
    messages: [
      {
        type: 'text',
        text: 'สวัสดีค่ะ เราเป็นผู้ช่วยปรึกษาด้านความรัก สำหรับหมามิ้น 💞'
      }
    ]
  }
  request({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'R4F/6zJiDoAJTeWZQXr5QlbFu0AkKfr3jn9FfMAWjwM6zD6ctTXP0aZ2uvU9RcTWZq03NGkkEd+Y+j43KLZ8/tCk6tadb+fPwWAevyWStXuCnspIXsaUkBr0tNJ1zGKkG307okSBzxoL7N2VuDBJAQdB04t89/1O/w1cDnyilFU='
    },
    url: 'https://api.line.me/v2/bot/message/push',
    method: 'POST',
    body: data,
    json: true
  }, function (err, res, body) {
    if (err) console.log('error')
    if (res) console.log('success')
    if (body) console.log(body)
  })
}
module.exports = router;
// app.listen(app.get('port'), function () {
//   console.log('run at port', app.get('port'))
// })