const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname,'goodreads.db')

let db=null

const initializeDbAndServer = async ()=>{
    try{
    db= await open({
        filename:dbPath,
        driver:sqlite3.Database,
    })
    app.listen(3000,()=>{
        console.log(`server running at port http://localhost:3000/`)
    })
    }catch(e){
    console.log(`dbError : ${e.message}`)
    process.exit(1)
    }
}
initializeDbAndServer()

// Get Books API
app.get('/books/', async (request, response) => {
  // let jwtToken;
  // const authHeader = request.headers["authorization"];
  // if(authHeader != undefined){
  //   jwtToken = authHeader.split(" ")[1]
  // }
  const getBooksQuery = `
  SELECT
    *
  FROM
    books
  ORDER BY
    bookId;`
  const booksArray = await db.all(getBooksQuery)
  response.send(booksArray)
})

// register user

app.post("/users/", async (request, response) => {
    const { username, name, password, gender, location } = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
          )`;
      const dbResponse = await db.run(createUserQuery);
      const newUserId = dbResponse.lastID;
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status = 400;
      response.send("User already exists");
    }
  });

  
// login user

app.post("/login", async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid User");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        const payload = {
          username:username,
        }

        const jwtToken = jwt.sign(payload,"My_Secret_Key")
        response.send(jwtToken);
      } else {
        response.status(400);
        response.send("Invalid Password");
      }
    }
  });