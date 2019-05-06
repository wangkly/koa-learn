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


var query = function( sql, values ) {
    return new Promise(( resolve, reject ) => {
      pool.getConnection(function(err, connection) {
        if (err) {
          reject( err )
        } else {
          connection.query(sql, values, ( err, rows) => {
  
            if ( err ) {
              reject( err )
            } else {
              resolve( rows )
            }
            connection.release()
          })
        }
      })
    })
  }  


module.exports={
    mysqlConn:connection,
    mysqlPool:pool,
    mysqlQuery:query
} 