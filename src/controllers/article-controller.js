var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');
const uuidv1 = require('uuid/v1');
const {promisify} = require('util');
var mongodurl = "mongodb://localhost:27017/";
import {decodeSession} from '../util';

var redis = require("redis"),
redisClient = redis.createClient();

const getAsync = promisify(redisClient.get).bind(redisClient);


exports.saveArticle = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let postData = ctx.request.body;
    let {title,content,cover} = postData;
    let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let session = await getAsync(tokenId);
     session = decodeSession(session)
    if(!session.account){
        ctx.body={status:200,success:false,errMsg:'请先登录'}
    }else{
        // let contentObj = JSON.parse(content);
        // let {blocks,entityMap} = contentObj;
        // let first = entityMap[0]||{};
        // let cover = first.data && first.data.url;
        // console.log(cover)
        let resp  = await dbase.collection('article').insertOne({title,content,author:session.account,cover,viewed:0,like:0,comment:0});
        if(resp.insertedCount == 1){
            ctx.body={status:200,success:true,errMsg:''}
        }
    }

    client.close();
    next();

}


exports.getArticles = async(ctx,next)=>{
    let postData = ctx.request.body;
    let {pageNo,pageSize} = postData; 
    let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let articles = await dbase.collection('article').find({}).project({content:0}).skip(pageNo*pageSize).limit(pageSize).toArray();
    ctx.body={
        status:200,success:true,errMsg:'',
        data: articles
    }

    next();

}


exports.getArticleById = async (ctx,next)=>{
    let postData = ctx.request.body;
    let {id} = postData;
    let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let article = await dbase.collection('article').findOne({'_id':ObjectID(id) });
    ctx.body={
        status:200,success:true,errMsg:'',
        data: article
    }
    next();
}




exports.saveComments = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let session = await getAsync(tokenId);
    if(!session){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }

    session = decodeSession(session)
    if(!session.account){
        ctx.body={status:200,success:false,errMsg:'请先登录'}
    }else{

        let postData = ctx.request.body;
        //repliRef_id 针对某条评论做回复，该评论的id
        let {article_id,content,repliRef_id} = postData;
        let {userId,account,headImg} = session;
        let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
        let dbase = client.db('koa');
        if(repliRef_id){//针对某条评论的回复 不允许针对评论的评论再评论
            //先找到这条评论
           let comment = await dbase.collection('comments').findOne({'_id':ObjectID(repliRef_id)});
           
           if(comment){
            let replies =[];
            replies.concat(comment.replies);
            replies.push({
                    _id:uuidv1(),
                    article_id,
                    content,
                    repliRef_id:repliRef_id,
                    author:account,
                    userId,
                    avatar:headImg,
                    like:0,
                    dislike:0,
                    datetime:(new Date()).getTime(),
                    replies:[]
                })
                
              await  dbase.collection('comments').findOneAndUpdate({'_id':ObjectID(repliRef_id)},{$set:{'replies':replies}});

              ctx.body={status:200,success:true,errMsg:''}
           }

        }else{//直接对文章进行的回复
           let resp = await dbase.collection('comments').insertOne({
                article_id,
                content,
                repliRef_id:0,
                author:account,
                userId,
                avatar:headImg,
                datetime:(new Date()).getTime(),
                like:0,
                dislike:0,
                replies:[]
            })
            
            if(resp.insertedCount == 1){
                ctx.body={status:200,success:true,errMsg:''}
            }
        }

        
    }

    await next();
}



exports.getComments =async (ctx,next)=>{
    let {id} = ctx.request.body;
    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');

    let comments = await dbase.collection('comments').find({'article_id':id}).toArray();
    ctx.body={status:200,success:true,errMsg:'',data:comments}

    await next();

}


exports.likeComment = async (ctx,next)=>{
    let {id,repliRef_id} = ctx.request.body;
    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');

    if(repliRef_id){//针对回复的回复
     await dbase.collection('comments').updateOne({_id:ObjectID(repliRef_id),'replies._id':id },{$inc:{'replies.$.like':1}})
    }else{//直接针对文章的回复
        await  dbase.collection('comments').updateOne({_id:ObjectID(id)},{$inc:{like:1}})
    }
    ctx.body={status:200,success:true,errMsg:''}
    await next();
}



exports.dislikeComment = async (ctx,next)=>{
    let {id,repliRef_id} = ctx.request.body;
    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');

    if(repliRef_id){//针对回复的回复
     await dbase.collection('comments').updateOne({_id:ObjectID(repliRef_id),'replies._id':id },{$inc:{'replies.$.dislike':1}})
    }else{//直接针对文章的回复
        await  dbase.collection('comments').updateOne({_id:ObjectID(id)},{$inc:{dislike:1}})
    }
    ctx.body={status:200,success:true,errMsg:''}
    await next();
}