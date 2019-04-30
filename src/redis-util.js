import * as bluebird from 'bluebird';
var redis = require("redis");

bluebird.promisifyAll(redis);
var  redisClient = redis.createClient();


export default redisClient;