
/**
 * 检查当前用户是否登录
 * cookies中是否有tokenId,
 * session中是否有登录信息
 */
exports.loginstatuscheck= async(ctx)=>{
    let result = {
        status:false,
        msg:'未登录'  
      }
    let tokenId = ctx.cookies.get('tokenId');
    if(tokenId){
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        if(session){
            if(session.expire > (new Date()).getTime()){//登录且未过期
                result.status=true;
                result.msg = '';
            }else{
                result.msg= '登录过期';
            }            
        }
    }
    return result;
}

/**
 * 检查当前要进行的操作是否合法，
 * 登录用户是否为要修改的目标用户
 */
exports.checkIfUserCanOperate = async (tokenId,userId)=>{
    let result ={status:false,msg:'非法操作'}
    if(tokenId){
        let session = await ctx.redisClient.hgetallAsync(tokenId);
        if(session.expire > (new Date()).getTime()){
            if(session.userId == userId){
                result.status=true;
                result.msg=''
            }else{
                result.msg='非用户本人不允许操作'
            }
        }
    }
    return result;
}