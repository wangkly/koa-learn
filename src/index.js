require("babel-register");
var Koa = require('koa');
// var router = require('koa-router')();

const bodyParser = require('koa-bodyparser');

import {getRoutes} from './routers';

var router = getRoutes();

var app = new Koa();

app.use(bodyParser())


app.use(async (ctx, next)=> {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}`)
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    ctx.set('Access-Control-Allow-Credentials',true);
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.type = 'application/json; charset=utf-8';
    if (ctx.method == 'OPTIONS') {
      ctx.status = 200;
      // ctx.body =null; 
    } else {
      await next();
    }
  });




app.use(router.routes())

app.listen(3001);