var {entries} = require('./entries');
var router = require('koa-router')();

function getRoutes(){
    for(var i = 0;i<entries.length;i++){
        var entry = entries[i];
        if(entry.method == 'GET'){
            router.get(entry.url,entry.handler)
        }
        if(entry.method == 'POST'){
            router.post(entry.url,entry.handler)
        }
    }

    return router;
}


module.exports={
    getRoutes:getRoutes
} 