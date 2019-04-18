require("babel-register");
var Koa = require('koa');
var path = require('path')
const koaStatic = require('koa-static');
const koaBody = require('koa-body');
const bodyParser = require('koa-bodyparser');
const {promisify} = require('util');
var redis = require("redis"),
redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);

import {encodeSession,decodeSession,EXPIRES} from './util';

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
      // ctx.body =null; 
    } else {
      await next();
    }
  });

  app.use(koaStatic(__dirname ,'public'))

  app.use(async(ctx,next)=>{
      let tokenId = ctx.cookies.get('tokenId');
      if(tokenId){//如果存在，则去redis中捞一下session
        let session = await getAsync(tokenId);
        if(session){
          session = decodeSession(session);
          //判断session 是否过期逻辑
          if(session.expire > (new Date()).getTime()){//未超时
            //后面只需要从ctx中取session值  
            // app.context.session = session; 这样不行 待查
            if(session.expire - (new Date()).getTime() <  1 * 60 * 1000){
                //更新expire 时间
                session.expire =  (new Date()).getTime()+ EXPIRES;
                redisClient.set(tokenId,encodeSession(session))
            }

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