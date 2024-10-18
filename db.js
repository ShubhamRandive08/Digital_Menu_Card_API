const {Pool} = require('pg');

//Create a new pool instance

const pool = new Pool({
    user : 'postgres',
    host : 'localhost',
    database : 'Digital_Menu_Card',
    password : 'Kingsr@08',
    port : 5432,
    
});

//Test the connection(This is optional)
pool.connect((err,client,release)=>{
    if(err){
        return console.error('Error aquiring client', err.stack);
    }

    //console.log(result.rows);
});
module.exports = pool;