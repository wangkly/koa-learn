var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var mongodurl = "mongodb://localhost:27017/";

import {checkIfUserCanOperate,loginstatuscheck} from './user-check-controller';

import redisClient from '../redis-util';
import {mysqlConn,mysqlQuery} from '../mysql-util';

exports.getUserInfo = async (ctx,next)=>{
    let {userId}= ctx.request.body;

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    //注意和 dbase.collection('user').find({'_id':ObjectID(userId)}).project({password:0}).toArray(); 差别
    let userInfo = await dbase.collection('user').findOne({'_id':ObjectID(userId)},{projection:{password:0}});
    
    ctx.body={status:200,success:true,errMsg:'',data:userInfo}

   await next();

}

//查询关注的人和粉丝数量
exports.countFollow = async (ctx,next)=>{
    let {userId} = ctx.request.body;
    let countsql = 'select count(*) as total from follow_relation where user_id =?';
    let countRes = await mysqlQuery(countsql,[userId]);
    let following = countRes[0].total||0;

     countsql = 'select count(*) as total from follow_relation where fol_user_id =?';
     countRes = await mysqlQuery(countsql,[userId]);
    let follower = countRes[0].total||0;

    ctx.body={status:200,success:true,errMsg:'',data:{following,follower}}
    await next();
}

//查询用户的关注对象
exports.queryFollows = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let {userId,pageNo=1,pageSize=10} = ctx.request.body;
    let countsql = 'select count(*) as total from follow_relation where user_id =?';
    let countRes = await mysqlQuery(countsql,[userId]);
    let total = countRes[0].total||0;

    let sql = 'select fol_user_id from follow_relation where user_id =? limit ?,?';
    let resp = await mysqlQuery(sql,[userId,(pageNo-1)*pageSize,pageSize]);
    let ids = resp.map((v,k)=>ObjectID(v.fol_user_id));

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');

    let result = await dbase.collection('user').find({'_id':{$in:ids}}).project({password:0}).toArray();

    result.map((user)=>user.following=false);

    let targetIds = result.map(user=>String(user._id));
    
    let checksql = `select fol_user_id from follow_relation where user_id =?  and fol_user_id in (?)`;
    //检查登录状态
    let loginStatus = await loginstatuscheck(ctx);
    if(loginStatus.status && targetIds.length > 0){
        let session = await redisClient.hgetallAsync(tokenId);
        let checkResp = await mysqlQuery(checksql,[session.userId,[targetIds]]);
        let objIds = checkResp.map(item=>item.fol_user_id);
        console.log('objIds ***',objIds)
        result.map((user)=>{
            console.log('user._id ***',user._id)
            console.log('objIds.indexOf  ***',objIds.indexOf(user._id))
            if(objIds.indexOf(user._id) > -1){
                user.following =true;
            }
            return user;
        })

    }

    ctx.body={status:200,success:true,errMsg:'',data:{result,total}}
    await next();
}


//查询关注该用户的人，粉丝
exports.queryFolowers = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let {userId,pageNo=1,pageSize=10} = ctx.request.body;
    let countsql = 'select count(*) as total from follow_relation where fol_user_id =?';
    let countRes = await mysqlQuery(countsql,[userId]);
    let total = countRes[0].total||0;

    let sql = 'select user_id from follow_relation where fol_user_id =? limit ?,?';
    let resp = await mysqlQuery(sql,[userId,(pageNo-1)*pageSize,pageSize]);
    let ids = resp.map((v,k)=>ObjectID(v.user_id));

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');

    let result = await dbase.collection('user').find({'_id':{$in:ids}}).project({password:0}).toArray();

    result.map((user)=>user.following=false);

    let targetIds = result.map(user=>"'"+user._id+"'");
    // let targetIds = result.map(user=>String(user._id));
    console.log('targetIds ***',targetIds)
    
    // let checksql = `select fol_user_id from follow_relation where user_id =?  and fol_user_id in (?)`;
    //检查登录状态
    let loginStatus = await loginstatuscheck(ctx);
    if(loginStatus.status && targetIds.length > 0){
        let session = await redisClient.hgetallAsync(tokenId);
        let checksql = `select fol_user_id from follow_relation where user_id ='${session.userId}'  and fol_user_id in (${targetIds.join(',')})`;
        console.log('checksql ***',checksql)
        let checkResp = await mysqlQuery(checksql);
        // let checkResp = await mysqlQuery(checksql,[session.userId,[targetIds]]);
        let objIds = checkResp.map(item=>item.fol_user_id);
        console.log('objIds ***',objIds)
        result.map((user)=>{
            if(objIds.indexOf(user._id) > -1){
                user.following =true;
            }
            return user;
        })

    }

    ctx.body={status:200,success:true,errMsg:'',data:{result,total}}
    await next();
}



exports.updateUserInfo = async(ctx,next)=>{
    let {userId,nickName,desc,gender} = ctx.request.body;
    //检查操作是否合法
    let tokenId = ctx.cookies.get('tokenId');

    let result = await checkIfUserCanOperate(tokenId,userId);

    if(result && result.status){

        let client = await MongoClient.connect(mongodurl,{useNewUrlParser:true});
        let dbase = client.db('koa');
        let resp = await dbase.collection('user').updateOne({_id:ObjectID(userId)},{$set:{nickName,desc,gender}});
        
        ctx.body={status:200,success:true,errMsg:''}


    }else{
        ctx.body={status:200,success:false,errMsg:'非用户本人不可操作'}
    }

    await next();
}



/**
 * 设置用户头像
 */
exports.setUserHeadImg = async(ctx,next)=>{
    let {userId,headImg} = ctx.request.body;
    let tokenId = ctx.cookies.get('tokenId');
    let result = await checkIfUserCanOperate(tokenId,userId);

    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'非法操作'};
        await next();
        return;
    }

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser:true});
    let dbase = client.db('koa');
    let resp =  await dbase.collection('user').findOneAndUpdate({'_id':ObjectID(userId)},{$set:{ headImg:headImg}});

    redisClient.hmset(tokenId,['headImg',headImg])
    
    ctx.body={status:200,success:true,errMsg:''}

    await next();
}
