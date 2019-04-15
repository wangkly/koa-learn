import { registHandler,loginHandler} from './controllers/login-regist-controller';
import {saveArticle,getArticles,getArticleById} from './controllers/article-controller';
import {uploadFile} from './controllers/file-controller';
var entries = [
    {
        url:'/regist',
        method:'POST',
        handler:registHandler

    },
    {
        url:'/login',
        method:'POST',
        handler:loginHandler

    },
    {
        url:'/saveArticle',
        method:'POST',
        handler:saveArticle

    },
    {
        url:'/upload',
        method:'POST',
        handler:uploadFile
    },
    {   
        url:'/index',
        method:'GET',
        handler:(ctx,next)=>{
            ctx.response.type='text/html';
            ctx.response.body=`<h1>Index</h1>`
        }
    },
    {
        url:'/hello/:name',
        method:'GET',
        handler:(ctx,next)=>{
            var name = ctx.params.name;
            ctx.response.body=`<h1>hello ${name}</h1>`
        }

    },
    {
        url:'/savetodo',
        method:'POST',
        handler:(ctx,next)=>{
            let name = ctx.cookies.get('name')
            console.log('cookies name **',name)
            let postData=ctx.request.body;
            ctx.response.body=postData
            // ctx.redirect('http://google.com');
        }

    },
    {
        url:'/querydata',
        method:'GET',
        handler:(ctx,next)=>{
            ctx.type = 'application/json'
            ctx.response.body={
                name:'wangkly',
                age:29
            }
        }

    },
    {
        url:'/init-banner',
        method:'GET',
        handler:(ctx,next)=>{
            ctx.type = 'application/json';
            ctx.response.body=[{
                id:1,
                name:'banner1',
                context:'this is banner 1',
                href:'www.baidu.com',
            },{
                id:2,
                name:'banner2',
                context:'this is banner 2',
                href:'www.1000.com',
            },{
                id:3,
                name:'banner3',
                context:'this is banner 3',
                href:'www.google.com',
            },
            {
                id:4,
                name:'banner4',
                context:'this is banner 4',
                href:'www.qianmi.com',
            }]
        }

    },
    {
        url:'/init-news',
        method:'GET',
        handler:getArticles

    },

    {
        url:'/getArticle',
        method:'POST',
        handler:getArticleById
    },
];

module.exports={
    entries:entries
}