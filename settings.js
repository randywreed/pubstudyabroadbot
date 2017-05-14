var fs = require('fs');
const KEYPATH='./SlackChatBot-eab39670660e.json';
var json = fs.readFileSync(KEYPATH, 'utf8');
var key = JSON.parse(json).private_key;
var SERVICE_ACCT_ID = 'calendaraccess@slackchatbot-158302.iam.gserviceaccount.com';

const CALENDAR_URL = 'appstate.edu_0tiia1p1q0ua0ae07hp5pk425c@group.calendar.google.com';
var CALENDAR_ID = {
  'primary': 'appstate.edu_0tiia1p1q0ua0ae07hp5pk425c@group.calendar.google.com',
};

module.exports.calendarId = CALENDAR_ID;
module.exports.serviceAcctId = SERVICE_ACCT_ID;
//module.exports.keyfile = KEYFILE;       //or if using json keys - module.exports.key = key; 
module.exports.calendarUrl = CALENDAR_URL;
module.exports.key = key;