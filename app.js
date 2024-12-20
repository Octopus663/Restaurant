const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeAdmin } = require('./auth');
const cors = require('cors');

const app = express();
const port = 3000;
const secret = 'lalala';


mongoose.connect('mongodb+srv://gansutovich:IUlfVn0rOQoyXDle@andrii.ct6tp.mongodb.net/?retryWrites=true&w=majority&appName=Andrii"', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Підключено до MongoDB');
}).catch(err => console.error('Помилка підключення:', err));

// Схеми MongoDB
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'user'] },
});

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
    customer_name: { type: String, required: true },
    order_details: { type: String, required: true },
    status: { type: String, required: true, default: 'pending', enum: ['pending', 'confirmed', 'closed'] },
});

const User = mongoose.model('User', userSchema);
const Dish = mongoose.model('Dish', dishSchema);
const Order = mongoose.model('Order', orderSchema);

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущено на http://localhost:${port}`);
});

// *** CRUD для Користувачів ***
app.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Всі поля є обов\'язковими' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();
        res.json({ message: 'Користувач успішно зареєстрований' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Невірний логін або пароль' });
        }
        const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/dishes', async (req, res) => {
    try {
        const dishes = await Dish.find();
        res.json(dishes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// *** CRUD для Страв ***
app.get('/dishes/:id', async (req, res) => {
    try {
        const dish = await Dish.findById(req.params.id);
        if (!dish) {
            return res.status(404).json({ message: 'Страву не знайдено' });
        }
        res.json(dish);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/dishes', async (req, res) => {
    try {
        const { name, price } = req.body;
        const newDish = new Dish({ name, price });
        await newDish.save();
        res.json(newDish);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/dishes/:id', async (req, res) => {
    try {
        const { name, price } = req.body;
        const updatedDish = await Dish.findByIdAndUpdate(req.params.id, { name, price }, { new: true });
        if (!updatedDish) {
            return res.status(404).json({ message: 'Страву не знайдено' });
        }
        res.json(updatedDish);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/dishes/:id', async (req, res) => {
    try {
        const deletedDish = await Dish.findByIdAndDelete(req.params.id);
        if (!deletedDish) {
            return res.status(404).json({ message: 'Страву не знайдено' });
        }
        res.json({ message: 'Страву видалено' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// *** CRUD для Замовлень ***
app.post('/orders', authenticateToken, async (req, res) => {
    try {
        const { customer_name, order_details } = req.body;
        const newOrder = new Order({ customer_name, order_details });
        await newOrder.save();
        res.json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.json({ message: `Замовлення з ID ${req.params.id} видалено` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/orders/:id/confirm', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: 'confirmed' }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/orders/:id/close', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/orders', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
