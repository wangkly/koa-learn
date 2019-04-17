var MongoClient = require('mongodb').MongoClient;
var mongodurl = "mongodb://localhost:27017/";
const {promisify} = require('util');
var redis = require("redis"),
    redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);

import {EXPIRES,md5,encodeSession,decodeSession} from '../util';    

exports.registHandler = async (ctx,next)=>{
    let postData=ctx.request.body;
    let {email,password} = postData;

    let client = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    var dbase = client.db("koa");
    let resp  = await dbase.collection('user').find({'account':email}).toArray();
    
    if(resp && resp.length == 0){
        await dbase.collection('user').insertOne({'account':email,'password':md5(password),headImg:''});
        ctx.body={status:200,success:true,errMsg:''}
        
    }else{
        ctx.body={status:200,success:false,errMsg:'已存在相同账号'}
    }

    client.close();

    next();

}

exports.loginHandler= async (ctx,next)=>{
    let postData =ctx.request.body;
    let {account,password} = postData;
    let client = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    var dbase = client.db("koa");
    let resp  = await dbase.collection('user').findOne({'account':account});

    if(!resp){
        ctx.body={status:200,success:false,errMsg:'账号不存在'}
    }else{
        if(md5(password) == resp.password){
            ctx.body={status:200,success:true,errMsg:null}
            let session_id =  (new Date()).getTime() + Math.random();
            let expire = (new Date()).getTime()+ EXPIRES;
            let session = {
                userId:resp._id,
                session_id,
                expire,
                account,
                headImg:resp.headImg
            };

            let tokenId = session_id;
            redisClient.set(tokenId,encodeSession(session))
            //将用户信息保存到session,设置cookies;
            ctx.cookies.set('tokenId', tokenId)

        }else{
            ctx.body={status:200,success:false,errMsg:'密码不正确'}
        }
    }

    client.close();
    next();

}

/**
 * 检测用户是否登录
 */
exports.checkIfLogin = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    if(tokenId){//存在cookie
        let session = await getAsync(tokenId);
        session = decodeSession(session)
        if(session.expire > (new Date()).getTime()){//session未过期
            ctx.body={status:200,success:true,errMsg:'',data:session}
        }else{
            ctx.body={status:200,success:false,errMsg:'登录已过期'}
        }
    }else{
        ctx.body={status:200,success:false,errMsg:'未登录'}
    }
    await next();
}