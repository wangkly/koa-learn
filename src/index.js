require("babel-register");
var Koa = require('koa');
// var router = require('koa-router')();

const bodyParser = require('koa-bodyparser');

import {getRoutes} from './routers';

var router = getRoutes();

var app = new Koa();



app.use(bodyParser())

// app.use((ctx,next)=>{
//     console.log(`Process ${ctx.request.method} ${ctx.request.url}`)
//     next();
//     ctx.response.set('Access-Control-Allow-Origin','http://localhost:3000');
//     ctx.response.set('Access-Control-Allow-Credentials',true);
//     ctx.response.set('Access-Control-Allow-Methods','GET, POST,OPTIONS');
// })



app.use(async (ctx, next)=> {
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    ctx.set('Access-Control-Allow-Credentials',true);
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.cookies.set('name', 'wangkly');
    if (ctx.method == 'OPTIONS') {
      ctx.response.status = 200;
      // ctx.body =null; 
    } else {
      await next();
    }
  });


// app.use((ctx,next)=>{
//     if(ctx.request.path=='/'){
//         ctx.response.body = 'index page';
//     }else{
//         next();
//     }
// })

// app.use((ctx,next)=>{
//     if(ctx.request.path==='/hello'){
//         ctx.response.body='hello koa';
//     }else{
//         next();
//     }
// })


// router.get('/hello/:name',(ctx,next)=>{
//     var name = ctx.params.name;
//     ctx.response.body=`<h1>hello ${name}</h1>`
// })


// router.get('/',(ctx,next)=>{
//     ctx.response.body=`<h1>Index</h1>`
// })


app.use(router.routes())

app.listen(3001);