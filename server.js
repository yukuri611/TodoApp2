require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;

// MySQL datbase connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
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

        const sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
        await db.query(sql, [username, passwordHash]);

        res.status(201).json({ message: 'ユーザー登録が成功しました。' });
    } catch (err) {
        if (err.code == "ER_DUP_ENTRY") {
            return res.status(400).json({ message: 'このユーザー名は既に使用されています。' });
        }
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const sql = "SELECT * FROM users WHERE username = ?";
        const [users] = await db.query(sql, [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'ユーザー名またはパスワードが正しくありません。' });
        }
        const user = users[0];

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
        const sql = "SELECT * FROM tasks WHERE user_id = ?";
        const [results] = await db.query(sql, [req.user.id]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

//Create a new task
app.post("/api/todos", verifyToken, async (req, res) => {
    try {
        const { text } = req.body;
        const userId = req.user.id;
        const sql = 'INSERT INTO tasks (content, user_id, is_completed) VALUES (?, ?, FALSE)';
        const [result] = await db.query(sql, [text, userId]);
        res.json({
            task_id: result.insertId,
            content: text,
            is_completed: false,
            user_id: userId
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

        const sql = 'UPDATE tasks SET content = ?, is_completed = ? WHERE task_id = ? AND user_id = ?';
        const [result] = await db.query(sql, [text, done, taskId, userId]);
        if (result.affectedRows === 0) {
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

        const sql = 'DELETE FROM tasks WHERE task_id = ? AND user_id = ?';
        const [result] = await db.query(sql, [taskId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'タスクが見つかりません。' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'サーバーエラーが発生しました。', error: err });
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
