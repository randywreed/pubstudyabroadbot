var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express();
const watson = require('watson-developer-cloud');
const conversation = new watson.ConversationV1({
  username: process.env.CONVERSATION_USERNAME || '<conversation_username>',
  password: process.env.CONVERSATION_PASSWORD || '<conversation_password>',
  version_date: watson.ConversationV1.VERSION_DATE_2017_04_21
})
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var moment=require('moment');
const CalendarAPI=require('node-google-calendar');
const CONFIG=require('./settings')
let calendarIDList=CONFIG.calendarId;
var GoogleSpreadsheet=require('google-spreadsheet');
var async=require('async');
var doc = new GoogleSpreadsheet('1c-PwNmXAj1KVrc2GW4ChdiH-nc-QqJ0Cv_1C8BVgthk')
console.log("calendarIDList");
console.log(calendarIDList);
var sheet
var random = require("random-js")();


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'Aha_Moment_Labs') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})


// API End Point - added by Stefan

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'hi') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, "parrot: " + text.substring(0, 200))
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

app.get('/today/', function (req, res){
  processMessage(req, res, 'What are we doing today?', function(event){
     console.log("post process message logic");
    //console.log(res);
    //console.log(req);
  console.log(event);
    var jsonResponse = [];
  jsonResponse.push({ "text": event });
    console.log(event);
    res.send(jsonResponse);
  });
});

app.get('/triptiprandom/', function (req, res){
  getTripTip(req, res, doc, function(tip){
    console.log("post process trip tip");
    console.log(tip);
    var jsonResponse = [];
  jsonResponse.push({ "text": tip });
    console.log(tip);
    res.send(jsonResponse);
 
  });
});

function getTripTip(req,res, doc, callback) {
  async.series([
  function setAuth(step) {
  var creds=require('./SlackChatBot-74c073c39fb6');
  doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
  doc.getInfo(function(err, info){
  console.log('Loaded doc: '+info.title+' by '+info.author.email);
  sheet=info.worksheets[0];
  console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
  step();
  });
  },
  function getArandomRow(step){

  // get real number of rows
  sheet.getRows(function (err, rows){
    console.log('Read '+rows.length+' rows');
   var value = random.integer(1,rows.length);
    console.log(value);
      sheet.getCells({
    'min-row': value,
    'max-row': value,
    'return-empty': false
  }, function (err, cells) {
   if (err){
     console.error('error in getCells '+err);
   }
    //console.log(cells);
    var cell=cells[0];
    console.log('Cell R'+cell.row+'C'+cell.col+' = '+cells[1].value);
    console.log('cell value');
    console.log(cells[1].value);
    callback(cells[1].value);
    step();
  });
    
  });
  /*
  for (var i=0; i<sheet.rowCount; i++){
    sheet.getCells({
      'min-row': i,
      'max-row':i,
      'return-empty':false
    }, function (err, cells) {
      if (err) {
      console.error (err);
      console.log('last row='+i-1);
      */
    }
]);

};

function processMessage(req, res, messtext, callback) {
  message(messtext, undefined)
  .then(response1 => {
    // APPLICATION-SPECIFIC CODE TO PROCESS THE DATA
    // FROM CONVERSATION SERVICE
    //console.log(JSON.stringify(response1, null, 2), '\n--------');
    var wtd=response1.entities[0].value;
    var out=response1.output.text+" \n";
    console.log(wtd);
    console.log(out);
    var tdm=moment(wtd);
  var tmm=moment(tdm).add(1,'days');
  console.log(tdm);
  console.log(tmm);
  var td=tdm.format();
  var tm=tmm.format();
  console.log(td);
  console.log(tm);
  let cal = new CalendarAPI(CONFIG);
  console.log(calendarIDList);
  let bookedEventsArray=[];
  var event=out;
  cal.listEvents(calendarIDList['primary'], td, tm)
    .then(json => {
    for (let i=0; i<json.length; i++) {
    /*
      let event={
        summary:json[i].summary
      };
      bookedEventsArray.push(event);
      */
      event += json[i].summary+" \n";
    };
    console.log('list events on calendar between '+td+' and '+tm);
    console.log(event);
    callback(event);
  
}).catch(err =>{
    console.log("error: listBookedEvent -" +err);
  });

    // invoke a second call to conversation
//return message('second message', response1.context);
      });

};
var token = " enter token here"

// function to echo back messages - added by Stefan

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}


// Send an test message back as two cards.

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Ai Chat Bot Communities",
                    "subtitle": "Communities to Follow",
                    "image_url": "http://1u88jj3r4db2x4txp44yqfj1.wpengine.netdna-cdn.com/wp-content/uploads/2016/04/chatbot-930x659.jpg",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.facebook.com/groups/aichatbots/",
                        "title": "FB Chatbot Group"
                    }, {
                        "type": "web_url",
                        "url": "https://www.reddit.com/r/Chat_Bots/",
                        "title": "Chatbots on Reddit"
                    },{
                        "type": "web_url",
                        "url": "https://twitter.com/aichatbots",
                        "title": "Chatbots on Twitter"
                    }],
                }, {
                    "title": "Chatbots FAQ",
                    "subtitle": "Aking the Deep Questions",
                    "image_url": "https://tctechcrunch2011.files.wordpress.com/2016/04/facebook-chatbots.png?w=738",
                    "buttons": [{
                        "type": "postback",
                        "title": "What's the benefit?",
                        "payload": "Chatbots make content interactive instead of static",
                    },{
                        "type": "postback",
                        "title": "What can Chatbots do",
                        "payload": "One day Chatbots will control the Internet of Things! You will be able to control your homes temperature with a text",
                    }, {
                        "type": "postback",
                        "title": "The Future",
                        "payload": "Chatbots are fun! One day your BFF might be a Chatbot",
                    }],
                },  {
                    "title": "Learning More",
                    "subtitle": "Aking the Deep Questions",
                    "image_url": "http://www.brandknewmag.com/wp-content/uploads/2015/12/cortana.jpg",
                    "buttons": [{
                        "type": "postback",
                        "title": "AIML",
                        "payload": "Checkout Artificial Intelligence Mark Up Language. Its easier than you think!",
                    },{
                        "type": "postback",
                        "title": "Machine Learning",
                        "payload": "Use python to teach your maching in 16D space in 15min",
                    }, {
                        "type": "postback",
                        "title": "Communities",
                        "payload": "Online communities & Meetups are the best way to stay ahead of the curve!",
                    }],
                }]  
            } 
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}
const message = function(text, context) {
  const payload = {
    workspace_id: process.env.WORKSPACE_ID || '<workspace_id>',
    input: {
      text: text
    },
    context: context
  };
  return new Promise((resolve, reject) =>
    conversation.message(payload, function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    })
  );
};
