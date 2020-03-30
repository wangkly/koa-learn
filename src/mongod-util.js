var MongoClient = require('mongodb').MongoClient;
var mongodurl = "mongodb://localhost:27017/";

var getMongoClient = async ()=>{
    let client = await MongoClient.connect(mongodurl,{ useNewUrlParser: true })
    return client;
}

module.exports={
    getMongoClient
}