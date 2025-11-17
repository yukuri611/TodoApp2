require('dotenv').config();
const express = require("express");
const { Pool } = require('pg');
const cors = require("cors");
const bodyParser = require("body-parser");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;

// PostgreSQL database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

// API settings

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'ユーザー名とパスワードは必須です。' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sql = "INSERT INTO users (username, password_hash) VALUES ($1, $2)";
        await pool.query(sql, [username, passwordHash]);

        res.status(201).json({ message: 'ユーザー登録が成功しました。' });
    } catch (err) {
        if (err.code == "23505") {
            return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
        }
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const sql = "SELECT * FROM users WHERE username = $1";
        const { rows } = await pool.query(sql, [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません。' });
        }
        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません。' });
        }

        // login successful, generate JWT
        const payload = {
            user: {
                id: user.user_id,
                username: user.username
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) {
        return res.status(401).json({ message: "認証トークンがありません" });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "無効な認証トークンです" });
        }
        req.user = decoded.user;
        next();
    });
}

//Todo API

// Get all tasks
app.get("/api/todos", verifyToken, async (req, res) => {
    try {
        const sql = "SELECT * FROM tasks WHERE user_id = $1";
        const { rows } = await pool.query(sql, [req.user.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

//Create a new task
app.post("/api/todos", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user.id;
        const sql = 'INSERT INTO tasks (content, user_id, is_completed) VALUES ($1, $2, FALSE) RETURNING *';
        const { rows } = await pool.query(sql, [text, userId]);
        const newTodo = rows[0];
        res.json({
            task_id: newTodo.task_id,
            content: newTodo.content,
            is_completed: newTodo.is_completed,
            user_id: newTodo.user_id
        });
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

// Update a task
app.put("/api/todos/:id", verifyToken, async (req, res) => {
    try {
        const { text, done } = req.body;
        const taskId = req.params.id;
        const userId = req.user.id;

        const sql = 'UPDATE tasks SET content = $1, is_completed = $2 WHERE task_id = $3 AND user_id = $4';
        const result = await pool.query(sql, [text, done, taskId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'タスクが見つかりません。' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

// Delete a task
app.delete('/api/todos/:id', verifyToken, async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const sql = 'DELETE FROM tasks WHERE task_id = $1 AND user_id = $2';
        const result = await pool.query(sql, [taskId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'タスクが見つかりません。' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
