var entries = [
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
            let postData=ctx.request.body;
            console.log('savetodo ** postData',postData);
            ctx.response.body=postData
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
        handler:(ctx,next)=>{
            ctx.type = 'application/json';
            ctx.response.body={
            data: [{
                    id:1,
                    name:'news1',
                    context:'this is news1',
                    href:'www.baidu.com',
                },{
                    id:2,
                    name:'news2',
                    context:'this is news2',
                    href:'www.1000.com',
                },{
                    id:3,
                    name:'news3',
                    context:'this is news3',
                    href:'www.google.com',
                },
                {
                    id:4,
                    name:'news4',
                    context:'this is news4',
                    href:'www.qianmi.com',
                }],
            total:100,
            page:1,    
            pageSize:10    
            }
        }

    }
];

module.exports={
    entries:entries
}