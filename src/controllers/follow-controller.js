var ObjectID = require('mongodb').ObjectID;
const uuidv1 = require('uuid/v1');

import {mysqlConn}  from '../mysql-util';

import {loginstatuscheck} from './user-check-controller';


exports.followTargetUser = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let {folUserId} = ctx.request.body;
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:result.msg}
    }else{
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let sql = 'insert into follow_relation (user_id,fol_user_id) values (?,?)'
        let addParams=[session.userId,folUserId]

        let resp = await new Promise((resolve,reject)=>{
            mysqlConn.query(sql,addParams,function (err, result) {
                if(err){
                    console.log('[INSERT ERROR] - ',err.message);
                    reject(err)
                   }     
                   console.log('INSERT ID:',result);  
                resolve(result)
            })
        }).catch((err)=>{
            console.log('follow err',err.message)
        });
        
        if(resp){
            console.log('****resp ,',resp)
            ctx.body={status:200,success:true,errMsg:''}
            next();
        }
    }
}



exports.unfollow = async(ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let {folUserId} = ctx.request.body;
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:result.msg}
    }else{
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let sql = 'delete from follow_relation where user_id =? and fol_user_id =?'
        let addParams=[session.userId,folUserId]

        await new Promise((resolve,reject)=>{
            mysqlConn.query(sql,addParams,function (err, result) {
                if(err){
                    reject(err)
                }
                resolve()
            })
        })

        ctx.body={status:200,success:true,errMsg:''}
        await next();

    }
}




exports.checkFollowed = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let {folUserId} = ctx.request.body;
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:result.msg}
    }else{
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let sql = 'select * from follow_relation where user_id =? and fol_user_id=?';
        let addParams=[session.userId,folUserId];
        let resp = await new Promise((resolve,reject)=>{
            mysqlConn.query(sql,addParams, function (err, result){
                if(result && result.length > 0){
                    // console.log('select **',result);
                    resolve(true);
                }else{
                    resolve(false)
                }
            })
            
        });

        if(resp){
            ctx.body={status:200,success:true,errMsg:''}
        }else{
            ctx.body={status:200,success:false,errMsg:''}
        }
       await next();
    }
}