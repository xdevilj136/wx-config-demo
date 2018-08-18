var express = require('express')
var request = require("request")
var sha1 = require('sha1')
var path = require('path')
var app = express()

//These are the basic info which you can find on wechat open platform home page
//http://mp.weixin.qq.com/
//The Docs http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html
let appId =  "你的公众号平台appid"
let appSecret =  "你的公众号平台密钥"
//WeChat access_token API endpoint
let token_url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid="+appId+"&secret="+appSecret;
//WeChat jsapi_ticket API endpoint
let ticket_url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=";
let access_token = null;
let ticket = null;
let update_interval = null;

app.use(function(req, res, next) {
  //CORS setting
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/signature', function (req, res , next) {
  console.log(req.query);
  //generate a 16 bit random string
  var nonce = Math.random().toString(36).substr(2, 15);
  //check if the ticket is null
  if (ticket == null) {
    //if ticket is null request a new one.
    console.log(token_url);
    request(token_url, function (error, response, body) {
      if (error) {
        res.json({"success":false});
      }else{
        let data = JSON.parse(body);
        access_token = data["access_token"];
        console.log('access_token',access_token);
        request(ticket_url+access_token,function(error, response, body){
          if(error){
            res.json({"success":false});
          }else {
            data = JSON.parse(body);
            ticket = data["ticket"];
            clearInterval(update_interval);
            //定时2小时，之后取最新的token获取最新ticket
            //(因为token和ticket有效期都为2小时)
            update_interval = setInterval(function(){
              ticket = null
            },7200*1000);
            
            let sha1 = createShaString(ticket,
                                      req.query.time_stamp,
                                      nonce,
                                      req.query.page_url);
            res.json({"signature":sha1,"nonce":nonce,"success":true});
          }
        });
      }
    });
  }else {

      res.json({"signature":createShaString(ticket,
                                            req.query.time_stamp,
                                            nonce,
                                            req.query.page_url),
      "nonce":nonce,"success":true});
  }
})
app.use(express.static(path.join(__dirname, 'public')));
app.listen(3000, function () {
  console.log('App listening on port 3000!')
})
//CreateShaString
let createShaString = function(ticket,timestamp,nonce,page_url){
  var string1 = "jsapi_ticket="+ticket+"&noncestr="+nonce+"&timestamp="+timestamp+"&url="+page_url;
  console.log(string1);
  return sha1(string1);
}
