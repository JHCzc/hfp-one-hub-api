const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    database: process.env.database,
    server: process.env.server,
    driver: 'msnodesqlv8',
    authentication: {
        type: 'ntlm',
        options: {
            domain: process.env.domain, // Replace with your domain
            userName: process.env.userName, // Replace with your Windows username
            password: process.env.password // Replace with your Windows password
        }
    },
    options: {
        // instanceName: 'SQLEXPRESS',
        trustedConnection: true
    }
}

const poolPromise = new sql.ConnectionPool(config).connect().then(
    pool => {
        console.log('Database connected');
        return pool;
    }
).catch(err => console.error('Database connection Failed! Bad Config:', err));

module.exports = {
    sql, poolPromise
}