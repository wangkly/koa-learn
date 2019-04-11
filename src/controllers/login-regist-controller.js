var MongoClient = require('mongodb').MongoClient;

var mongodurl = "mongodb://localhost:27017/";


exports.registHandler = async (ctx,next)=>{
 
    let postData=ctx.request.body;
    let {email,password} = postData;
    
    ctx.response.body=postData

    let {err,client} = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    if (err) throw err;
    
    var dbase = client.db("koa");

    let resp  = await dbase.collection('learn').findOne({'account':email})

    console.log('resp **',resp)

    // ,function(err, res) {
    //     if (err) throw err;
    //     console.log('查找结果',res);
    //     client.close();
    // });


    // ,(err,client)=>{

    //     dbase.collection('learn').insertOne({'account':email,'password':password},function(err,res){
    //         if (err) throw err;
    //         console.log('保存结果',res);
    //         client.close();
    //     })





    // })
}