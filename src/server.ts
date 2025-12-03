import express, { Request, Response } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const app = express();
const port = 5000;

// Middleware
app.use(express.json());

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STR,
});

// Initialize Database
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      age INT,
      phone VARCHAR(15),
      address TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      completed BOOLEAN DEFAULT FALSE,
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("Database initialized successfully!");
};

initDb();

// Routes
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!");
});

// Create new user
app.post("/users", async (req: Request, res: Response) => {
  const { Name, Email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
      [Name, Email]
    );
    //console.log(result.rows[0]);
    //res.send({
      //message:"data inserted"    })
      res.status(201).json({
      success: false,
      message:"Data Inserted Successfully",
      data:result.rows[0]
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
  
});
  app.get("/users",async(req:Request,res:Response)=>{
    try{
  const result = await pool.query(`Select *from users `);
  res.status(200).json({
    success:true,
    message:"Users retrieved successfully",
    data :result.rows,
    
  })
    }
       catch(err:any){
         res.status(500).json({
          success :false,
          message:err.message,
        details:err
         })
       }
  })

// single user
app.get("/users/:id", async(req:Request, res:Response)=>{
try{
 const result= await pool.query(`select *from users where id=$1`,[req.params.id]);
 if(result.rows.length===0){
 res.status(404).json({
   success :false,
          message:"User not found",
 });
} else{
  res.status(200).json({
     success :true,
          message:"User fetched successfully",
          data :result.rows[0]

  })
}
}catch(err:any){
 res.status(500).json({
          success :false,
          message:err.message,
        details:err
         })
}
});




app.put("/users/:id", async(req:Request, res:Response)=>{
  const {Name,Email}=req.body;
try{
 const result= await pool.query(` Update  users set  Name=$1, Email=$2 where id=$3 returning *`,[Name,Email, req.params.id]);
 if(result.rows.length===0){
 res.status(404).json({
   success :false,
          message:"User not found",
 });
} else{
  res.status(200).json({
     success :true,
          message:"User update successfully",
          data :result.rows[0]

  })
}
}catch(err:any){
 res.status(500).json({
          success :false,
          message:err.message,
        details:err
         })
}
});



app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1`,
      [req.params.id]
    );
 
    if (result.rowCount=== 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result.rows,
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
