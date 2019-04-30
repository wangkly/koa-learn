var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');
const uuidv1 = require('uuid/v1');
const {promisify} = require('util');

var mongodurl = "mongodb://localhost:27017/";
import {decodeSession,checkUserOperationLegal} from '../util';

var redis = require("redis"),
redisClient = redis.createClient();

const getAsync = promisify(redisClient.get).bind(redisClient);


exports.getUserInfo = async (ctx,next)=>{
    let {userId}= ctx.request.body;

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    //注意和 dbase.collection('user').find({'_id':ObjectID(userId)}).project({password:0}).toArray(); 差别
    let userInfo = await dbase.collection('user').findOne({'_id':ObjectID(userId)},{projection:{password:0}});
    
    ctx.body={status:200,success:true,errMsg:'',data:userInfo}

   await next();

}



exports.updateUserInfo = async(ctx,next)=>{
    let {userId,nickName,desc,gender} = ctx.request.body;
    //检查操作是否合法
    let tokenId = ctx.cookies.get('tokenId');
    if(tokenId){
        let session = await getAsync(tokenId);
        if(session){
            session = decodeSession(session)
            if(session.expire > (new Date()).getTime()){//session未过期
                if(session.userId != userId){
                    ctx.body={status:200,success:false,errMsg:'非用户本人不可操作'}
                }else{

                    let client = await MongoClient.connect(mongodurl,{useNewUrlParser:true});
                    let dbase = client.db('koa');
                    let resp = await dbase.collection('user').updateOne({_id:ObjectID(userId)},{$set:{nickName,desc,gender}});
                    
                    ctx.body={status:200,success:true,errMsg:''}
                    
                }
            }else{
                ctx.cookies.set('tokenId','');
                redisClient.del('tokenId');
                ctx.body={status:200,success:false,errMsg:'登录已过期'}
            }

        }else{
            ctx.cookies.set('tokenId', '')
            ctx.body={status:200,success:false,errMsg:'用户未登录'}
        }

    }else{
        ctx.body={status:200,success:false,errMsg:'用户未登录'}
    }

    await next();
}



/**
 * 设置用户头像
 */
exports.setUserHeadImg = async(ctx,next)=>{
    let {userId,headImg} = ctx.request.body;
    let tokenId = ctx.cookies.get('tokenId');
    let result = await checkUserOperationLegal(tokenId,userId);

    if(!result){
        ctx.body={status:200,success:false,errMsg:'非法操作'};
        await next();
        return;
    }

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser:true});
    let dbase = client.db('koa');
    let resp =  await dbase.collection('user').findOneAndUpdate({'_id':ObjectID(userId)},{$set:{ headImg:headImg}});
    
    ctx.body={status:200,success:true,errMsg:''}

    await next();
}
