import mysql from 'mysql';

var connection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'root',
    database:'koa'
})

connection.connect();


var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : 'root',
    database        : 'koa'
  });


module.exports={
    mysqlConn:connection,
    mysqlPool:pool
} 