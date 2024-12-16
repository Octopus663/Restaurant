const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');
app.set('view engine', 'ejs');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});

// Читання всіх страв
app.get('/dishes', (req, res) => {
    connection.query('SELECT * FROM dishes', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Читання однієї страви за ID
app.get('/dishes/:id', (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM dishes WHERE id = ?', [id], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results[0] || {});
    });
});

// Створення нової страви
app.post('/dishes', (req, res) => {
    const { name, price } = req.body;
    connection.query('INSERT INTO dishes (name, price) VALUES (?, ?)', [name, price], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: result.insertId, name, price });
    });
});

// Оновлення страви
app.put('/dishes/:id', (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    connection.query('UPDATE dishes SET name = ?, price = ? WHERE id = ?', [name, price, id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Страву оновлено' });
    });
});

// Видалення страви
app.delete('/dishes/:id', (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM dishes WHERE id = ?', [id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Страву видалено' });
    });
});
app.get('/dishes', (req, res) => {
    connection.query('SELECT * FROM dishes', (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.render('index', { dishes: results }); // Передаємо дані у index.ejs
    });
});

