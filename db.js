const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'Andrii',
    password: 'andrii01!',
    database: 'Restaurant'
});

connection.connect((err) => {
    if (err) {
        console.error('Помилка підключення до БД:', err.message);
        return;
    }
    console.log('Підключено до MySQL');
});

module.exports = connection;
