const dotenv = require('dotenv');
const {app, server} = require('./app');
dotenv.config();

const PORT = process.env.PORT || 3088;
server.listen(PORT, ()=>{
    console.log(`server is running on http://localhost:${PORT}`)
})