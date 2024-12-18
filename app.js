const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');

const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeAdmin } = require('./auth');
const secret = 'lalala';

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).json({ error: 'Невірний логін або пароль' });
        }

        const user = { id: results[0].id, role: results[0].role };
        const token = jwt.sign(user, secret, { expiresIn: '1h' });

        res.json({ token });
    });
});

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
        res.redirect('/dishes');
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
app.get('/', (req, res) => {
    connection.query('SELECT * FROM dishes', (err, results) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.render('index', { dishes: results }); // Передаємо дані у index.ejs
    });
});


// 6. Створення замовлення
app.post('/orders', authenticateToken,(req, res) => {
    const { customer_name, order_details } = req.body;
    connection.query(
        'INSERT INTO orders (customer_name, order_details, status) VALUES (?, ?, "pending")',
        [customer_name, order_details],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: result.insertId, customer_name, order_details, status: "pending" });
        }
    );
});

// 7. Видалення замовлення
app.delete('/orders/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM orders WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Замовлення з ID ${id} видалено` });
    });
});

// 8. Підтвердження замовлення
app.post('/orders/:id/confirm',authenticateToken, authorizeAdmin, (req, res) => {
    const { id } = req.params;
    connection.query('UPDATE orders SET status = "confirmed" WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Замовлення з ID ${id} підтверджено` });
    });
});

// 9. Закриття замовлення
app.post('/orders/:id/close', authenticateToken, authorizeAdmin,(req, res) => {
    const { id } = req.params;
    connection.query('UPDATE orders SET status = "closed" WHERE id = ?', [id], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: `Замовлення з ID ${id} закрито` });
    });
});

// 10. Отримання інформації про замовлення по ID
app.get('/orders/:id',  authenticateToken, (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM orders WHERE id = ?', [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.json(results[0]);
    });
});
app.get('/orders',  authenticateToken, authorizeAdmin, (req, res) => {
    connection.query('SELECT * FROM orders', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// Реєстрація користувача
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Всі поля є обов\'язковими' });
    }

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Користувач з таким іменем вже існує' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Користувач успішно зареєстрований' });
        });
    });
});
