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


exports.getUserInfo = async (ctx,next)=>{
    let {userId}= ctx.request.body;

    let client = await MongoClient.connect(mongodurl,{useNewUrlParser: true });
    let dbase = client.db('koa');
    let userInfo = await dbase.collection('user').findOne({'_id':ObjectID(userId)}).project({password:0});

   ctx.body={status:200,success:true,errMsg:'',data:userInfo}

   await next();

}