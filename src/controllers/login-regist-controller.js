var MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var mongodurl = "mongodb://localhost:27017/";

var redis = require("redis"),
    redisClient = redis.createClient();

// const client = new MongoClient(mongodurl);

function md5 (text) {
    return crypto.createHash('md5').update(text).digest('hex');
  };


exports.registHandler = async (ctx,next)=>{
    let postData=ctx.request.body;
    let {email,password} = postData;

    let client = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    var dbase = client.db("koa");
    let resp  = await dbase.collection('user').find({'account':email}).toArray();
    console.log('regist find ',resp)
    if(resp && resp.length == 0){
        await dbase.collection('user').insertOne({'account':email,'password':md5(password)});
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
            let tokenId = 'abc'
            redisClient.set(tokenId,account)
            //将用户信息保存到session,设置cookies;
            ctx.cookies.set('tokenId', tokenId)

        }else{
            ctx.body={status:200,success:false,errMsg:'密码不正确'}
        }
    }

    client.close();
    next();

}