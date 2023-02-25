require('dotenv').config({path: '../.env'})
const { Client } = require('pg');

const client = new Client({
    // connectionString: process.env.DATABASE_URL,
    connectionString: 'postgres://bjoaqvdezqbfhn:96106df7ca2a2962f3f7043f15f1526ca871f7b6f421eac5815c560caba8f681@ec2-3-218-171-44.compute-1.amazonaws.com:5432/d9te73q6ml6t9g',
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect();

module.exports = client;