var express = require('express');
var router = express.Router();
var https = require('https');
var    fs = require('fs');
const path = require('path');
const TOKEN = process.env.LINE_ACCESS_TOKEN
router.get("/webhook", function(req, res) {
    res.send("HTTP POST request sent to the webhook URL!")
    // If the user sends a message to your bot, send a reply message
    let message="message";
    if (message === "message") {
      // Message data, must be stringified
      const dataString = JSON.stringify({
        replyToken: "R4F/6zJiDoAJTeWZQXr5QlbFu0AkKfr3jn9FfMAWjwM6zD6ctTXP0aZ2uvU9RcTWZq03NGkkEd+Y+j43KLZ8/tCk6tadb+fPwWAevyWStXuCnspIXsaUkBr0tNJ1zGKkG307okSBzxoL7N2VuDBJAQdB04t89/1O/w1cDnyilFU=",
        messages: [
          {
            "type": "text",
            "text": "Hello, user"
          },
          {
            "type": "text",
            "text": "May I help you?"
          }
        ]
      })
  
      // Request header
      const headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TOKEN
      }
  
      // Options to pass into the request
      const webhookOptions = {
        "hostname": "api.line.me",
        "path": "/v2/bot/message/reply",
        "method": "POST",
        "headers": headers,
        "body": dataString
      }
  
      // Define request
      const request = https.request(webhookOptions, (res) => {
        res.on("data", (d) => {
          process.stdout.write(d)
        })
      })
  
      // Handle error
      request.on("error", (err) => {
        console.error(err)
      })
  
      // Send data
      request.write(dataString)
      request.end()
    }
  })

router.get('/connect', async (req, res) => {
    res.send('สวัสดี express webhook')
res.end()
    // res.writeHead(200, {
    //     'Content-Type': 'text/html'
    // });
    // fs.readFile('apronline/testline.html', null, function (error, data) {
    //     if (error) {
    //         res.writeHead(404);
    //         res.write('Whoops! File not found!');
    //     } else {
    //         res.write(data);
    //     }
    //     res.end();
    // });
    // fs.readFile('apronline/testline.html', function (err, html) {
    //     if (err) {
    //         throw err; 
    //     }       
    //     http.createServer(function(request, response) {  
    //         response.writeHeader(200, {"Content-Type": "text/html"});  
    //         response.write(html);  
    //         response.end();  
    //     }).listen(8000);
    // });

    // const t = async function findUserInfo(context, num) {
    //     const { userId, displayName } = await context.getUserProfile();
    //     console.log(userId)
    // };
    //   res.status(200).json({ status: true, data: "connect" });
    //res.end();
});
module.exports = router;