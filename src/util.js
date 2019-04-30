
var crypto = require('crypto');
const {promisify} = require('util');


import * as bluebird from 'bluebird';
var redis = require("redis");

bluebird.promisifyAll(redis);
var  redisClient = redis.createClient();

const hgetAllAsync = promisify(redisClient.hgetall).bind(redisClient);

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


/**
 * 检查用户操作是否合法
 */
exports.checkUserOperationLegal = async (tokenId,userId)=>{
    if(tokenId){
        let session = await hgetAllAsync(tokenId);
        if(session){
         
            if(session.expire > (new Date()).getTime()){//session未过期
                if(session.userId != userId){
                    return false;
                }else{
                    return true;
                }
            }else{
                ctx.cookies.set('tokenId','');
                redisClient.del('tokenId');
                return false;
            }
        }else{
            ctx.cookies.set('tokenId', '')
            return false;
        }
    }else{
       return false;
    }
}