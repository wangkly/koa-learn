var ObjectID = require('mongodb').ObjectID;

const uuidv1 = require('uuid/v1');

import {loginstatuscheck} from './user-check-controller';


exports.saveArticle = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let postData = ctx.request.body;
    let {title,content,cover,desc} = postData;
    let client  = ctx.mongoClient;;
    let dbase = client.db('koa');
    let session = await ctx.redisClient.hgetallAsync(tokenId);
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:result.msg}
    }else{
        // let contentObj = JSON.parse(content);
        // let {blocks,entityMap} = contentObj;
        // let first = entityMap[0]||{};
        // let cover = first.data && first.data.url;
        // console.log(cover)
        let resp  = await dbase.collection('article').insertOne({
                                            title,
                                            content,
                                            author:session.nickName||session.account,
                                            userId:session.userId,
                                            cover,
                                            desc,
                                            viewed:0,
                                            like:0,
                                            comment:0,
                                            addtime:Date.now()
                                        });
        if(resp.insertedCount == 1){
            ctx.body={status:200,success:true,errMsg:''}
        }
    }

    client.close();
    next();

}

//获取首页banners
exports.getBanners =async(ctx,next)=>{
    let client = ctx.mongoClient;;
    let dbase = client.db('koa');
    let banners = await dbase.collection('banners').find({}).toArray();
    ctx.body={status:200,success:true,errMsg:'',data:banners};
    client.close();
    await next();
}


//将文章添加收藏
exports.addFavorite =async(ctx,next)=>{
    let {articleId} = ctx.request.body; 
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }else{
        let tokenId = ctx.cookies.get('tokenId');
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let client  = ctx.mongoClient;
        let dbase = client.db('koa');
        let userData = await dbase.collection('favorite').findOne({userId:session.userId});
        if(userData){
            let articles = userData.articles||[];
            if(articles.indexOf(articleId) > -1 ){
                ctx.body={status:200,success:false,errMsg:'你已收藏过了'};
            }else{
                await dbase.collection('favorite').updateOne({userId:session.userId},{$push:{articles:articleId}});
                ctx.body={status:200,success:true,errMsg:''};
            }
        }else{
            await dbase.collection('favorite').insertOne({userId:session.userId,articles:[articleId]});
            ctx.body={status:200,success:true,errMsg:''};
        }
        client.close();
        await next();
        return;
    }

}

exports.likeArticle=async (ctx,next)=>{
    let {articleId} = ctx.request.body; 
    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }else{
        let tokenId = ctx.cookies.get('tokenId');
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let client  = ctx.mongoClient;
        let dbase = client.db('koa');
        //检查是否已经点过赞
        let article = await dbase.collection('article').findOne({_id:ObjectID(articleId)});
        let likes =  article.likes||[];
        if(likes.indexOf(session.userId) > -1){
            ctx.body={status:200,success:false,errMsg:'你已经赞过了'};
            await next();
            return;
        }

        await dbase.collection('article').updateOne({_id:ObjectID(articleId)},{$inc:{like:1},$push:{likes:session.userId}})
    
        ctx.body={status:200,success:true,errMsg:''}
        client.close();
    }
    await next();
}


//检查用户是否点赞、收藏
exports.checkLikeAndFavo =async(ctx,next)=>{
    let {articleId} = ctx.request.body; 
    let data={
        like:false,
        favorite:false
    }
     //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'未登录',data:data};
        await next();
        return;
    }else{
        let tokenId = ctx.cookies.get('tokenId');
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        let client  = ctx.mongoClient;
        let dbase = client.db('koa');

        //检查是否已经点过赞
        let article = await dbase.collection('article').findOne({_id:ObjectID(articleId)});
        let likes =  article.likes||[];
        if(likes.indexOf(session.userId) > -1){
            data.like =true;
        }

        //检查是否已经收藏
        let userData = await dbase.collection('favorite').findOne({userId:session.userId});
        if(userData){
            let articles = userData.articles||[];
            if(articles.indexOf(articleId) > -1){
                data.favorite =true;
            }
        }
        client.close();
    }

    ctx.body={status:200,success:true,errMsg:'',data:data};
    await next();
}


exports.getArticles = async(ctx,next)=>{
    let postData = ctx.request.body;
    let {pageNo,pageSize} = postData; 
    let client  = ctx.mongoClient;
    let dbase = client.db('koa');
    let articles = await dbase.collection('article').find({}).project({content:0}).sort({addtime:-1}).skip(pageNo*pageSize).limit(pageSize).toArray();
    ctx.body={
        status:200,success:true,errMsg:'',
        data: articles
    }
    client.close();
   await next();

}

/**
 * 获取user的文章
 */
exports.getUserArticles = async(ctx,next)=>{
    let postData = ctx.request.body;
    let {pageNo,pageSize,userId} = postData; 
    let client  = ctx.mongoClient;
    let dbase = client.db('koa');
    let total = await dbase.collection('article').count({userId});
    let articles = await dbase.collection('article').find({userId}).project({content:0}).skip((pageNo-1)*pageSize).limit(pageSize).toArray();
    ctx.body={
        status:200,success:true,errMsg:'',
        data: {articles,total}
    }
    client.close();
   await next();
}


exports.getArticleById = async (ctx,next)=>{
    let postData = ctx.request.body;
    let {id} = postData;
    let client  = ctx.mongoClient;
    let dbase = client.db('koa');
    let article = await dbase.collection('article').findOne({'_id':ObjectID(id) });
    ctx.body={
        status:200,success:true,errMsg:'',
        data: article
    }
    client.close(); 
    await next();
}




exports.saveComments = async (ctx,next)=>{
    let tokenId = ctx.cookies.get('tokenId');
    let session = await ctx.redisClient.hgetallAsync(tokenId);

    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }else{

        let postData = ctx.request.body;
        //repliRef_id 针对某条评论做回复，该评论的id
        let {article_id,content,repliRef_id} = postData;
        let {userId,account,headImg} = session;
        let client  = ctx.mongoClient;
        let dbase = client.db('koa');
        if(repliRef_id){//针对某条评论的回复 不允许针对评论的评论再评论
            //先找到这条评论
           let comment = await dbase.collection('comments').findOne({'_id':ObjectID(repliRef_id)});
           
           if(comment){
            // let replies =[];
            // replies.concat(comment.replies);
            // replies.push({
            //         _id:uuidv1(),
            //         article_id,
            //         content,
            //         repliRef_id:repliRef_id,
            //         author:account,
            //         userId,
            //         avatar:headImg,
            //         like:0,
            //         dislike:0,
            //         datetime:(new Date()).getTime(),
            //         replies:[]
            //     })
            //   await  dbase.collection('comments').findOneAndUpdate({'_id':ObjectID(repliRef_id)},{$set:{'replies':replies}});

            let comm = {
                _id:uuidv1(),
                article_id,
                content,
                repliRef_id:repliRef_id,
                author:account,
                userId,
                avatar:headImg,
                like:0,
                dislike:0,
                datetime:(new Date()).getTime(),
                replies:[]
            }

            await  dbase.collection('comments').findOneAndUpdate({'_id':ObjectID(repliRef_id)},{$push:{'replies':comm}});
            ctx.body={status:200,success:true,errMsg:''}
            }

        }else{//直接对文章进行的回复
           let resp = await dbase.collection('comments').insertOne({
                article_id,
                content,
                repliRef_id:0,
                author:account,
                userId,
                avatar:headImg,
                datetime:(new Date()).getTime(),
                like:0,
                dislike:0,
                replies:[]
            })
            //评论+1
            await dbase.collection('article').updateOne({_id:ObjectID(article_id)},{$inc:{comment:1}})
            
            if(resp.insertedCount == 1){
                ctx.body={status:200,success:true,errMsg:''}
            }
        }
        client.close();
        await next();
    }
}



exports.getComments =async (ctx,next)=>{
    let {id} = ctx.request.body;
    let client = ctx.mongoClient;
    let dbase = client.db('koa');

    let comments = await dbase.collection('comments').find({'article_id':id}).toArray();
    ctx.body={status:200,success:true,errMsg:'',data:comments}
    client.close();
    await next();

}


exports.likeComment = async (ctx,next)=>{
    let {id,repliRef_id} = ctx.request.body;

    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }

    let client = ctx.mongoClient;
    let dbase = client.db('koa');

    if(repliRef_id){//针对回复的回复
     await dbase.collection('comments').updateOne({_id:ObjectID(repliRef_id),'replies._id':id },{$inc:{'replies.$.like':1}})
    }else{//直接针对文章的回复
        await  dbase.collection('comments').updateOne({_id:ObjectID(id)},{$inc:{like:1}})
    }
    ctx.body={status:200,success:true,errMsg:''}
    client.close();
    await next();
}



exports.dislikeComment = async (ctx,next)=>{
    let {id,repliRef_id} = ctx.request.body;

    //检查登录状态
    let result = await loginstatuscheck(ctx);
    if(!result.status){
        ctx.body={status:200,success:false,errMsg:'请先登录'};
        await next();
        return;
    }

    let client = ctx.mongoClient;
    let dbase = client.db('koa');

    if(repliRef_id){//针对回复的回复
     await dbase.collection('comments').updateOne({_id:ObjectID(repliRef_id),'replies._id':id },{$inc:{'replies.$.dislike':1}})
    }else{//直接针对文章的回复
        await  dbase.collection('comments').updateOne({_id:ObjectID(id)},{$inc:{dislike:1}})
    }
    ctx.body={status:200,success:true,errMsg:''}
    client.close();
    await next();
}