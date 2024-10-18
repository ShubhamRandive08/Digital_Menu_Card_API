const express = require('express') // For get access the express 
const pool = require('./db') // Assuming the connestion wtih the db modules
const app = express() // Create the object of the express()
const path = require('path') // To access the path of the file location
const bodyparser = require('body-parser') // For the send the all param into the format of the body
const port = 5000; // Run the APIs on the that port no.
const {body, validationResult } = require('express-validator') // Validate the parameter to send by the users which is null or not null or so on
const { error } = require('console')
const { constants } = require('buffer')
// const { error } = require('console')
// const { statSync } = require('fs')

// This code is used for the access the apis everywhere
app.use((req,res,next) =>{
    res.header("Access-Control-Allow-Origin","*");
    res.header("Access-Control-Allow-Methods","DELETE,GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type");
    next();

})

// For the send the param into the format of the body
app.use(bodyparser.json())


// Register credintioal of the users
app.post('/register', 
    [body('username').isLength({min : 3}).withMessage('Username must be at least 3 Character long').custom(async (value) =>{
    //Check if username already exist in the database
    const result = await pool.query('select * from users where name = $1',[value]);

    if(result.rows.length > 0){
        Promise.reject('Username already in use.');
    }
}),

body('email').isEmail().withMessage('Must be a valid email address').custom(async (value) =>{
    //Check if username already exist in the database
    const result = await pool.query('select * from users where email = $1',[value]);

    if(result.rows.length > 0){
        Promise.reject('email is already in use.');
    }
}),

body('password').isLength({min : 6}).withMessage('Password must be containe 6 character.')
],

async (req,res) =>{
    const error = validationResult(req)

    if(!error.isEmpty()){
        return res.status(400).json({error : error.array()})
    }


    try{
    const {username,email,password} = req.body

        //INsert the new user into the database.
        await pool.query('insert into users (name,email,pwd) values ($1,$2,$3)',[username,email,password])

        res.send('User register success')
    }catch (err){
        console.error(err.message)
        res.status(500).send('Server User')
    }
})

app.post('/login',[
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
], async (req,res)=>{
    const error = validationResult(req)

    if(!error.isEmpty()){
        return res.status(400).json({errors : error.array()})
    }

    const {email,password} = req.body

    try{
        const result = await pool.query('select * from users where email = $1',[email])

        if(result.rows.length === 0){
            return res.status(400).json({errors : [{msg : 'Invalid email or password'}]})
        }

        const user = result.rows[0];

        // Comapre the provided the password with the hashed password in the database

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.status(400).json({errors : [{msg : 'Invalid email or password'}]})
        }
        //If the password matches, authentication is success
        res.send('Login successful')

        res.status(500).send('Error')
    }catch (err){
        console.log(err.massage)
    }
})


// Select the all those data from the database
app.get('/userdata', async (req,res) =>{
    try{
        const result = await pool.query('select id,email,pwd from users')
        res.json(result.rows)
    }catch (err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// If the user can be entered successfull login credintial then user loged in.

// --------------- Select the all menu
app.get('/menu', async (req,res) =>{
    try{
        const result = await pool.query('select * from menu')
        res.json({status : '200', message : 'success', data : result.rows})

    }catch (err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// ---------------------- Select the menu by id

app.post('/menuById',[
    body('id').notEmpty().withMessage('id is required')
], async (req,res) => {
    try{
        const errors = validationResult(req)

        const {id} = req.body

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const rs = await pool.query('select * from menu where mid = $1',[id])

            if(rs.rows.length > 0){
                const result = await pool.query('select * from menu where mid = $1',[id])
                res.json({status : '200', message : 'success', menu : result.rows})
            }else{
                res.json({status : '400', message : 'id is not avalible.'})
            }
        }
    }catch (err){
        console.error(err.message)
        res.status(400).send('Server Error')
    }
})

// ---------------------------------- Insert the menu

app.post('/insertmenu',[
    body('menu_name').notEmpty().withMessage('Menu name is required.'),
    body('menu_price').notEmpty().withMessage('Menu price  is required.'),
    body('gid').notEmpty().withMessage('Gid  is required.'),
    body('qid').notEmpty().withMessage('qid  is required.')

], async (req,res)=>{
    try{

        const errors = validationResult(req)


        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
        const {menu_name, menu_price, gid, qid} = req.body

        const rs = await pool.query('select menu_name from menu')
        console.log(rs.rows.value)
            const result = await pool.query('insert into menu (menu_name, menu_price, gid, qid) values ($1,$2,$3,$4)', [menu_name, menu_price, gid, qid])
        res.json({status : '200',message : 'Menu insert Success'})
        }
    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error.')
    }
})

// --------------------------------- Delete the menu

app.delete('/delmenu',[
    body('id').notEmpty().withMessage('id is required.')
], async (req,res)=>{
    try{
        const errors = validationResult(req)

        const {id} = req.body

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{

            const rs = await pool.query('select * from menu where mid = $1',[id])
            console.log(rs.rows.length)
            if(rs.rows.length > 0){
                 await pool.query('delete from menu where mid = $1', [id])
                res.json({status : '200', message : 'Delete Success'})
            }else{
                res.json({status : '400', message : 'Delete Failed.'})
            }
        }
        
        
    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error.')
    }
})


// --------------------------------- Update the menu

app.put('/menuUpt',[
    body('menu_name').notEmpty().withMessage('Menu name is required'),
    body('menu_price').notEmpty().withMessage('Menu price is required'),
    body('gid').notEmpty().withMessage('gid is required'),
    body('qid').notEmpty().withMessage('qid  is required'),
    body('mid').notEmpty().withMessage('mid  is required')

], async (req,res) =>{
    try{
        const errors = validationResult(req)

        const {menu_name,menu_price,gid,qid,mid} = req.body


        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const rs = await pool.query('select * from menu where mid = $1',[mid])
            console.log(rs.rows.length)

            if(rs.rows.length > 0){
                await pool.query('update menu set menu_name = $1, menu_price = $2, gid = $3, qid = $4 where mid = $5',[menu_name,menu_price,gid,qid,mid])

                res.json({status : '200', message : 'Update success'})
            }else{
                res.json({status : '400', message : 'Update failed.'})
            }
            
        }
        
    }catch (err){
        console.error(err.massage)
        res.status(500).send('Server Error')
    }
})


// ---------------------------------------------------------------------------------------------------------------------------
// APIs for the food_group table

app.get('/foodgroup', async (req,res) =>{
    try{
        const result = await pool.query('select * from food_group')
        res.json({status : '200', message : 'success', foodgroup : result.rows})
    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

app.post('/foodgroupById',[
    body('id').notEmpty().withMessage('id is required')
],
    async (req,res) =>{
      try{
        const errors = validationResult(req)

        const {id} = req.body

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const rs = await pool.query('select * from food_group where gid = $1',[id])

            if(rs.rows.length > 0){
                const result =  await pool.query('select * from food_group where gid = $1',[id])
                res.json({status : '200', message : 'success', food_group : result.rows})
            }else{
                res.json({status : '400', message : 'Id is not availible into the database.'})
            }
        }
      }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
      }
    }
)

app.post('/insert_food_group',[
    body('gname').notEmpty().withMessage('Food Group is required')
],async (req,res)=>{
    try{
        const {gname} = req.body

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const result = await pool.query('insert into food_group (gname) values ($1)',[gname])
            res.json({status : '200', message : 'Insert Success'})
        }
    }catch(err){
        console.error(err.message)
        res.status(400).send('Server Error')
    }
})


app.put('/uptFoodGroup',[
    body('id').notEmpty().withMessage('Food group id is required'),
    body('gname').notEmpty().withMessage('Food group name is required')
],async (req,res) =>{
    try{
        const {gname,id} = req.body

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{

           const rs =  await pool.query('select * from food_group where gid = $1',[id])

           if(rs.rows.length > 0){
            await pool.query('update food_group set gname = $1 where gid = $2',[gname,id])
            res.json({status : '200', message : 'Update success'})
           }else{
            res.json({status : '400', message : 'Update failed.'})
           }
        }
    }catch (err){
        console.error(err.message)
        res.status(400).send('Server Error')
    }
})

app.delete('/delfoodgroup',[
    body('gid').notEmpty().withMessage('Food group id is required')
], async (req,res) =>{
    try{
        const {gid} = req.body

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const rs = await pool.query('select * from food_group where gid = $1',[gid])

            if(rs.rows.length > 0){
                await pool.query('delete from food_group where gid = $1',[gid])
                res.json({status : '200', message : 'Delete success', })
            }else {
                res.json({status : '400', message : 'Delete failed'})
            }
        }
    }catch (err){
        console.error(err.message)
        res.status(400).send('Server Error')
    }

})

// -------------------------------------  APIs for the qtymast table.
// --------------------- Select the all qty type for the database
app.get('/qtymast', async (req,res)=>{
    try{
        const result = await pool.query('select * from qtymast')
        res.json({stutas : '200', message : 'success', qtymast : result.rows})
    }catch(e){
        console.error(e.message)
        res.status(500).send('Server Error')
    }
})

// ----------------------- Select the qty type based on the id number
app.post('/qtymastbyid',[
    body('id').notEmpty().withMessage('id is requierd')
], async (req,res)=>{
    const errors = validationResult(req)

    const {id} = req.body

    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()})
    }else{
        const rs = await pool.query('select * from qtymast where qid = $1',[id])

        if(rs.rows.length > 0){
            const result = await pool.query('select * from qtymast where qid = $1',[id])
            res.json({status : '200', message : 'succuss', qty : result.rows})
        }else{
            res.json({status : '400', message : 'id is not found'})
        }
    }
})


// ------------------  Insert the qty type into the database
app.post('/insertQty',[
    body('qtytype').notEmpty().withMessage('Qty type is required')
], async (req,res) =>{
    try{
        const errors = validationResult(req)

    const {qtytype} = req.body

    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()})
    }else{
        await pool.query('insert into qtymast(qtytype) values ($1)',[qtytype])

        res.json({stutas : '200', message : 'Insert success'})
    }
    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

// -------------------- Delete the record from the database

app.delete('/delqtymast',[
    body('id').notEmpty().withMessage('id is required')
], async (req,res)=>{
    try{
        const errors = validationResult(req)

        const {id} = req.body

        if(!errors.isEmpty()){
            return res.stutas(400).json({erros : erros.array()})
        }else{
            const rs = await pool.query('select * from qtymast where qid = $1',[id])

            if(rs.rows.length > 0){
                await pool.query('delete from qtymast where qid = $1',[id])
                res.json({stutas : '200', message : 'Qty type delete successfully'})
            }else{
                res.json({stutas : '400', message : 'Id can not be found' })
            }
        }
    }catch(err){ 
        console.error(err.message)
        res.status(500).withMessage('Server Error')
    }
})

// --------------------  Update the qty type from the database

app.put('/uptQtymast',[
    body('id').notEmpty().withMessage('Id is required'),
    body('qtytype').notEmpty().withMessage('Qty type is required')
], async (req,res) =>{
    try{
        const {qtytype,id} = req.body

        const errors = validationResult(req)

        if(!errors.isEmpty()){
            return res.status(400).json({errors : errors.array()})
        }else{
            const rs = await pool.query('select * from qtymast where qid = $1',[id])

            if(rs.rows.length > 0){
                const result = await pool.query('update qtymast set qtytype = $1 where qid = $2',[qtytype,id])

                res.json({stutas : '200', message : 'Update success'})

            }else{
                res.json({stutas : '400', message : 'Update failed , Id dose not exist'})
            }
        }
    }catch(err){
        console.error(err.message)
        res.status(500).send('Server Error')
    }
})

//------------------------------ Display the all menucard wiht all facilities to the end user

app.get('/menucard', async (req,res)=>{
    try{
        const result = await pool.query('select menu_name, gname, qtytype,menu_price from food_group, menu, qtymast where menu.gid =food_group.gid and menu.qid = qtymast.qid order by menu_price desc')
        res.json({stutas : '200', message : 'success', menucard : result.rows})
    }catch(err){
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})

//Select the count of menu card
app.get('/countMenu', async (req,res)=>{
    try{
        const result = await pool.query('select * from menu')
        res.json({stutas : '200', message : 'success', menucard : result.rows})
    }catch(err){
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})

app.get('/countFoodGroup', async (req,res)=>{
    try{
        const result = await pool.query('select * from food_group')
        res.json({stutas : '200', message : 'success', food_group : result.rows})
    }catch(err){
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})

app.get('/countQtyMast', async (req,res)=>{
    try{
        const result = await pool.query('select * from qtymast')
        res.json({stutas : '200', message : 'success', qtymast : result.rows})
    }catch(err){
        console.log(err.message)
        res.status(500).send('Server Error')
    }
})

app.listen(port, ()=>{
    console.log(`Server starts on http://localhost:${port}`)
})

