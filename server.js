require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL datbase connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) throw err;
    console.log("Connected to database");
});

// API settings

// Get all tasks
app.get("/api/todos", (req, res) => {
    const sql = "SELECT * FROM tasks";
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

//Create a new task
app.post("/api/todos", (req, res) => {
    const { text } = req.body;
    const sql = "INSERT INTO tasks (content) VALUES (?)";
    db.query(sql, [text], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, text: text, done: false });
    });
});

// Update a task
app.put("/api/todos/:id", (req, res) => {
    const { text, done } = req.body;
    const sql = 'UPDATE tasks SET content = ?, is_completed = ? WHERE task_id = ?';
    db.query(sql, [text, done, req.params.id], (err) => {
        if (err) throw err;
        res.json({ success: true });
    });
});

// Delete a task
app.delete('/api/todos/:id', (req, res) => {
    const sql = 'DELETE FROM tasks WHERE task_id = ?';
    db.query(sql, [req.params.id], (err) => {
        if (err) throw err;
        res.json({ success: true });
    });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});
