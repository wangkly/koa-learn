var MongoClient = require('mongodb').MongoClient;

var mongodurl = "mongodb://localhost:27017/";


exports.registHandler = async (ctx,next)=>{
 
    let postData=ctx.request.body;
    let {email,password} = postData;
    
    ctx.response.body=postData

    let client = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    var dbase = client.db("koa");
    let resp  = await dbase.collection('learn').findOne({'account':email});
    if(!resp){
        dbase.collection('learn').insertOne({'account':email,'password':password}).then((err,result)=>{
            console.log('save ** result',result)
        });
    }else{
        ctx.status = 500,
        ctx.type = 'application/json; charset=utf-8';
        ctx.body={status:500,msg:'已存在相同账号'}
    }

    client.close();

}