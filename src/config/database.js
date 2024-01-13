require('dotenv').config()
//postgreSQL
const { Pool } = require("pg")

const pool = new Pool ({
    "user" : process.env.DB_USER,
    "password" : process.env.DB_PASSWORD,
    "host" : process.env.DB_HOST,
    "database" : process.env.DB_DATABASE,
    "port" : process.env.DB_PORT,
    "max" : 10
});

module.exports = pool
// 다른 파일에서도 쓰겠다