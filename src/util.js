
var crypto = require('crypto');


exports.EXPIRES = 20 * 60 * 1000;

exports.md5 =  (text)=> {
    return crypto.createHash('md5').update(text).digest('hex');
};


exports.encodeSession =(session)=>{
    return Buffer.from(JSON.stringify(session)).toString('base64')
}


exports.decodeSession = (session)=>{
   let str =  Buffer.from(session,'base64').toString('utf-8');
    return JSON.parse(str||{});
}
