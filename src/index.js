require("babel-register");
var Koa = require('koa');
const koaStatic = require('koa-static');
const koaBody = require('koa-body');
const bodyParser = require('koa-bodyparser');

import redisClient from './redis-util';

import {EXPIRES} from './util';

import {getRoutes} from './routers';

var router = getRoutes();

var app = new Koa();

app.use(async (ctx, next)=> {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}`)
    ctx.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    ctx.set('Access-Control-Allow-Credentials',true);
    ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    ctx.type = 'application/json; charset=utf-8';
    if (ctx.method == 'OPTIONS') {
      ctx.status = 200;
    } else {
      await next();
    }
  });

  app.use(koaStatic(__dirname ,'public'))

  app.use(async(ctx,next)=>{
      let tokenId = ctx.cookies.get('tokenId');
      if(tokenId){//如果存在，则去redis中捞一下session

        let session = await redisClient.hgetallAsync(tokenId);

        if(session){
  
          //判断session 是否过期逻辑
          if(session.expire > (new Date()).getTime()){//未超时
            //更新expire 时间
            let expire =  (new Date()).getTime()+ EXPIRES;
            redisClient.hmset(tokenId,['expire',expire])

          }
        }
      }
     await next();
    })

  // app.context.session ={'key':'aaa'};

  app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
    }
  }))

  app.use(bodyParser())



  app.use(router.routes())

  app.listen(3001);