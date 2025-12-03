import express, { NextFunction, Request, Response } from "express";
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
// logger middlewarree
const logger =(req:Request,res:Response, next:NextFunction)=>{
  console.log(`[${new Date().toISOString()}]]${req.method}${req.path}\n`);
  next();
}

// Routes
app.get("/", logger,(_req: Request, res: Response) => {
  res.send("Hello World!");
});

// =========================
//      CREATE USER
// =========================
app.post("/users", async (req: Request, res: Response) => {
  const { Name, Email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
      [Name, Email]
    );

    res.status(201).json({
      success: true,
      message: "Data Inserted Successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =========================
// NEW CREATE ROUTE (Only name + email)
// =========================
app.post("/new-user", async (req: Request, res: Response) => {
  const { name, email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );

    res.status(201).json({
      success: true,
      message: "New User Created Successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});

// =========================
//     GET ALL USERS
// =========================
app.get("/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
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

// =========================
//     GET SINGLE USER
// =========================
app.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE id=$1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});

// =========================
//       UPDATE USER
// =========================
app.put("/users/:id", async (req: Request, res: Response) => {
  const { Name, Email } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,
      [Name, Email, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});

// =========================
//       DELETE USER
// =========================
app.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1`,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: null,
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});
//todos crud
 app.post("/todos", async (req: Request, res: Response) => {
  const { user_id, title } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO todos (user_id, title) VALUES ($1, $2) RETURNING *`,
      [user_id, title]
    );

    res.status(201).json({
      success: true,
      message: "Todo created successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
      details: err,
    });
  }
});


app.get("/todos", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM todos`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No todos found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Todos retrieved successfully",
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


app.use((req:Request,res:Response)=>{
  res.status(404).json({
    success:false,
    message :"Route not found",
    path:req.path,
  })
})
// Start server
app.listen(port, () => {
  console.log(`Server Listening on port ${port}`);
});
