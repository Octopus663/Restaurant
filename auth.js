const jwt = require('jsonwebtoken');
const secret = 'lalala';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен не знайдено' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недійсний токен' });
        }
        req.user = user;
        next();
    });
}

function authorizeAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено' });
    }
    next();
}

module.exports = { authenticateToken, authorizeAdmin };
