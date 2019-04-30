var MongoClient = require('mongodb').MongoClient;
var mongodurl = "mongodb://localhost:27017/";

import redisClient from '../redis-util';

import {loginstatuscheck,checkIfUserCanOperate} from './user-check-controller';

import {EXPIRES,md5} from '../util';    

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

    await next();

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
                userId:resp._id.toString(),
                userName:resp.nickName,
                session_id,
                expire,
                account,
                headImg:resp.headImg
            };

            let tokenId = session_id;
            redisClient.hmset(tokenId,session)
            //将用户信息保存到session,设置cookies;
            ctx.cookies.set('tokenId', tokenId)

        }else{
            ctx.body={status:200,success:false,errMsg:'密码不正确'}
        }
    }

    client.close();
    await next();

}


exports.logoutHandler =async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    ctx.cookies.set('tokenId', '')
    redisClient.del(tokenId);
    ctx.body={status:200,success:true,errMsg:''}
}


/**
 * 检测用户是否登录
 */
exports.checkIfLogin = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let session = await redisClient.hgetallAsync(tokenId);
    let result = await loginstatuscheck(ctx);

    if(result && result.status){

            ctx.body={status:200,success:true,errMsg:'',data:session};

    }else{
            ctx.cookies.set('tokenId', '')
            tokenId && redisClient.del(tokenId);
            ctx.body={status:200,success:false,errMsg:result.msg}

    }
    
    await next();
}

/**
 * 检查当前这个cookies里的tokenId
 * 是否有权限修改传递的userId对应的用户信息的权限
 */
exports.checkUserOperateRight = async (ctx,next)=>{
    let userId = ctx.params.userId
    let tokenId = ctx.cookies.get('tokenId');
    let result = await checkIfUserCanOperate(tokenId,userId)

    if(result && result.status){
        ctx.body={status:200,success:true,errMsg:''}

    }else{
        // ctx.cookies.set('tokenId','');
        // tokenId && redisClient.del(tokenId);
        ctx.body={status:200,success:false,errMsg:result.msg}
    }

    await next();
}