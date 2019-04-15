var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var crypto = require('crypto');
const {promisify} = require('util');
var mongodurl = "mongodb://localhost:27017/";


var redis = require("redis"),
redisClient = redis.createClient();

const getAsync = promisify(redisClient.get).bind(redisClient);


exports.saveArticle = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let postData = ctx.request.body;
    let {title,content} = postData;
    let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let account = await getAsync(tokenId);

    if(!account){
        ctx.body={status:200,success:false,errMsg:'请先登录'}
    }else{
        let resp  = await dbase.collection('article').insertOne({title,content,account});
        if(resp.insertedCount == 1){
            ctx.body={status:200,success:true,errMsg:''}
        }
    }

    client.close();
    next();

}


exports.getArticles = async(ctx,next)=>{
    let client  = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let articles = await dbase.collection('article').find({}).toArray();
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