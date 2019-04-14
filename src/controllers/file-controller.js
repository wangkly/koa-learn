
var path = require('path');
var fs = require('fs');

exports.uploadFile = async (ctx,next)=>{
    // 上传单个文件
  const file = ctx.request.files.file; // 获取上传文件
  let reader = fs.createReadStream(file.path);
  let filePath = path.join(__dirname, '../public/upload') + `/${file.name}`;
  let write = fs.createWriteStream(filePath);
  reader.pipe(write)
  
  ctx.body={
      status:200,
      success:true,
      errMsg:'',
      data:`http://localhost:3001/public/upload/${file.name}`
  }


}