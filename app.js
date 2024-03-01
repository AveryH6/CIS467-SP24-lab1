const express = require('express')
// const bodyParser = require('bodyParser')
const app = express()
const PORT = 3000
const mysql = require('mysql2/promise')
const config = require('./config')

app.use( express.json() )
app.use( express.urlencoded( {extended: true} ))

const pool = mysql.createPool( config.db) 

app.listen(PORT, async () => {
    const host = process.env.HOSTNAME || "http://localhost"
    console.log(`Listening on ${host}:${PORT}`)
})

app.use( (req, res, next)=> {
    req.user = {id:4, name:"Kenan"}
    next()
})

///////// TAGS //////////

// Get all users
app.get('/', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [users, ] = await conn.query("SELECT * FROM users")

        conn.release()

        res.json(users)
    }
    catch( err) {
        res.json( {message: "error"})
        console.error(err)
    }
    
})

// Get all Tags
app.get('/api/v1/tags', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [tags, ] = await conn.query("SELECT * FROM tags")

        conn.release()

        res.json(tags)
    }
    catch( err) {
        res.json( {message: "error"})
        console.error(err)
    }
    
})

// Get specific tag
app.get('/api/v1/tags/:id', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [tags, ] = await conn.query("SELECT * FROM tags WHERE tagID=" + req.params.id)

        conn.release()

        if( tags.length > 0) {
            res.json(tags[0])
        }else{
            res.status(404).json({message: "Tag not found"})
        }

        
    }
    catch( err) {
        res.status(500).json( {message: "error"})
        console.error(err)
    }
    
})

// Post new Tag
app.post( '/api/v1/tags/', async (req, res) => {
    const { tagDescription } = req.body;

    try{
        const connection = await pool.getConnection()

        // repeat tags
        const [existingTag, ] = await connection.query(
            "SELECT * FROM tags WHERE tagDescription=?",
            [tagDescription]
        )
        if(existingTag.length > 0) {
            connection.release()
            res.status(303).json(existingTag[0])
        } else {
           await connection.query(
            'INSERT INTO tags (tagDescription) VALUES (?)',
             [tagDescription]
             )

            const [newTag] = await connection.query(
                "SELECT * FROM tags WHERE tagDescription=?",
                [tagDescription]
                )

            connection.release()
            res.status(201).json(newTag[0])  
        }

          

    } catch (err){
        console.error("Error creating tag:", err)
        res.status(500).send("Error creating tag")
    }

})

// Update Tag
app.put('/api/v1/tags/:id', async (req, res)=>{
    const {tagDescription} = req.body

    try{

        const conn = await pool.getConnection()
        await conn.query(
            "UPDATE tags SET tagDescription = ? WHERE tagID=?",
            [tagDescription, req.params.id]
        )

        const [updatedTag] = await conn.query(
            "SELECT * FROM tags WHERE tagID=?",
            [req.params.id]
        )

        conn.release()

        if( updatedTag.length > 0) {
           res.status(200).json(updatedTag[0]) 
        } else {
            res.status(404).json({message:"Tag not found"})
        }
        
    } catch (err) {
        console.error("Error Updating Tag:", err)
        res.status(500).send("Error Updating Tag")
    }
})


// Delete Tag
app.delete('/api/v1/tags/:id', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [tags] = await conn.query("DELETE FROM tags WHERE tagID=" + req.params.id)

        conn.release()

        if( tags.affectedRows > 0) {
            res.status(201).json({message: "Tag Removed"})
        }else{
            res.status(404).json({message: "Tag not found"})
        }

    } catch( err){
        res.status(500).json( {message: "error"})
        console.error(err)
    }
})

////////// PRAYERS //////////

// Get all prayers
app.get('/api/v1/prayers', async (req,res)=> {
    try{
        const conn = await pool.getConnection();
        console.log(req.user)
        const [prayers, ] = await conn.query("SELECT prayers.prayerID, prompt, body, coverImage, audioRecitation, aiCreator, userID, verses FROM prayers JOIN prayerscreators ON prayers.prayerID=prayerscreators.prayerID JOIN prayersscriptures ON prayers.prayerID=prayersscriptures.prayerID JOIN scriptures ON prayersscriptures.scriptureID=scriptures.scriptureID")

        conn.release()

        res.json(prayers)
    } catch(err) {
        res.json( { message: "error" } )
        console.error(err)
    }
})

// Get specific prayer id
app.get('/api/v1/prayers/:id', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [prayers, ] = await conn.query("SELECT prayers.prayerID, prompt, body, coverImage, audioRecitation, aiCreator, userID, verses FROM prayers JOIN prayerscreators ON prayers.prayerID=prayerscreators.prayerID JOIN prayersscriptures ON prayers.prayerID=prayersscriptures.prayerID JOIN scriptures ON prayersscriptures.scriptureID=scriptures.scriptureID WHERE prayers.prayerID=" + req.params.id)

        conn.release()

        if( prayers.length > 0) {
            res.json(prayers[0])
        }else{
            res.status(404).json({message: "Tag not found"})
        }

        
    }
    catch( err) {
        res.status(500).json( {message: "error"})
        console.error(err)
    }
})

// Post new prayer
// {
//     "prayerID": 32,
//     "prompt": "Lords Prayer",
//     "body": "Our Father, who art in heaven, Hallowed be thy Name. Thy Kingdom come. Thy will be done, On earth as it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive those who trespass against us. And lead us not into temptation, But deliver us from evil. For thine is the kingdom, The power, and the glory, For ever and ever. Amen.",
//     "coverImage": "prayingHands.jpg",
//     "audioRecitation": "prayer.mp4",
//     "aiCreator": "ChatGPT 3.5"
// }
app.post( '/api/v1/prayers/', async (req, res) => {
    const { prompt } = req.body;
    const { body } = req.body;
    const { coverImage } = req.body;
    const { audioRecitation } = req.body;
    const { aiCreator } = req.body;

    try{
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO prayers (prompt, body, coverImage, audioRecitation, aiCreator) VALUES (?, ?, ?, ?, ?)',
             [prompt, body, coverImage, audioRecitation, aiCreator]
             )

        const [newPrayer] = await connection.query(
            "SELECT * FROM prayers WHERE prompt=? AND body=? AND coverImage=? AND audioRecitation=? AND aiCreator=?",
             [prompt, body, coverImage, audioRecitation, aiCreator]
             )

        connection.release();
        res.status(201).json(newPrayer[0])

    } catch (err){
        console.error("Error creating prayer:", err)
        res.status(500).send("Error creating prayer")
    }

})

// Edit exitsting Prayer

// Delete Prayer
app.delete('/api/v1/prayer/:id', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [prayers, ] = await conn.query("DELETE FROM prayers WHERE prayerID=" + req.params.id)

        conn.release()

        if( prayers.length > 0) {
            res.json(prayers[0])
        }else{
            res.status(404).json({message: "Tag not found"})
        }

        res.status(201).json("Prayer Removed")
    } catch( err){
        res.status(500).json( {message: "error"})
        console.error(err)
    }
})

////////// LIKES //////////

// Get all likes of prayer with given id (for all users)
app.get('/api/v1/prayers/:id/likes', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [prayers, ] = await conn.query("SELECT likedID, prayerID, userID FROM likes WHERE prayerID=" + req.params.id)

        conn.release()

        res.status(201).json(prayers)
    } catch (err) {
        res.status(500).json( { message: "error" } )
        console.error(err)
    }
})

// Like a Prayer with a given ID (for current user)
app.post('/api/v1/prayers/:id/likes', async (req, res)=> {
    const { prayerID } = req.body;
    const userID = req.params.id; // Retrieve userID from request parameters

    try {
        const connection = await pool.getConnection()

        // Check if a like already exists for this prayer and user
        const [existingLike] = await connection.query(
            "SELECT likedID, prayerID, userID FROM likes WHERE prayerID = ? AND userID = ?",
            [prayerID, userID]
        )
        if (existingLike.length > 0) {
            connection.release()
            return res.status(409).json({ error: "Like already exists" })
        }

        // Insert the like into the database
        await connection.query(
            'INSERT INTO likes (prayerID, userID, likedTime) VALUES (?, ?, NOW())',
            [prayerID, userID]
        )

        // Retrieve the newly inserted like
        const [newLike] = await connection.query(
            "SELECT likedID, prayerID, userID FROM likes WHERE prayerID = ? AND userID = ?",
            [prayerID, userID]
        )

        connection.release()
        res.status(201).json(newLike[0])  
    } catch (err) {
        console.error("Error creating like:", err)
        res.status(500).send("Error creating like")
    }

    
})

//Delete a prayer
app.delete('/api/v1/prayers/:id/likes', async (req, res)=> {
    const { prayerID } = req.body;
    const userID = req.params.id;
    try {
        const conn = await pool.getConnection();
        const [delLike] = await conn.query("DELETE FROM likes where prayerID=? AND userID=?",
        [prayerID, userID])

        conn.release()

        if( delLike.affectedRows > 0 ){
            res.status(201).json({ message: "Like Removed." })
        } else {
            res.status(404).json({message: "Like not found"})
        }
    } catch(err) {
        res.status(500).json( {message: "error"})
        console.error(err)
    }
})


////////// SAVES //////////


app.get('/api/v1/prayers/:id/saves', async (req, res)=> {
    try {
        const conn = await pool.getConnection();
        console.log(req.user)
        const [saves, ] = await conn.query("SELECT likedID, prayerID, userID FROM saves WHERE prayerID=" + req.params.id)

        conn.release()

        res.status(201).json(saves)
    } catch (err) {
        res.status(500).json( { message: "error" } )
        console.error(err)
    }
})

// Like a Prayer with a given ID (for current user)
app.post('/api/v1/prayers/:id/saves', async (req, res)=> {
    const { prayerID } = req.body;
    const userID = req.params.id; // Retrieve userID from request parameters

    try {
        const connection = await pool.getConnection()

        // Check if a like already exists for this prayer and user
        const [existingSave] = await connection.query(
            "SELECT likedID, prayerID, userID FROM saves WHERE prayerID = ? AND userID = ?",
            [prayerID, userID]
        )
        if (existingSave.length > 0) {
            connection.release()
            return res.status(409).json({ error: "Save already exists" })
        }

        // Insert the like into the database
        await connection.query(
            'INSERT INTO saves (prayerID, userID, likedTime) VALUES (?, ?, NOW())',
            [prayerID, userID]
        )

        // Retrieve the newly inserted like
        const [newSave] = await connection.query(
            "SELECT likedID, prayerID, userID FROM saves WHERE prayerID = ? AND userID = ?",
            [prayerID, userID]
        )

        connection.release()
        res.status(201).json(newSave[0])  
    } catch (err) {
        console.error("Error creating like:", err)
        res.status(500).send("Error creating like")
    }

    
})

//Delete a save
app.delete('/api/v1/prayers/:id/saves', async (req, res)=> {
    const { prayerID } = req.body;
    const userID = req.params.id;
    try {
        const conn = await pool.getConnection();
        const [delSave] = await conn.query("DELETE FROM saves where prayerID=? AND userID=?",
        [prayerID, userID])

        conn.release()

        if( delSave.affectedRows > 0 ){
            res.status(201).json({ message: "Save Removed." })
        } else {
            res.status(404).json({message: "Save not found"})
        }
    } catch(err) {
        res.status(500).json( {message: "error"})
        console.error(err)
    }
})


app.post('')