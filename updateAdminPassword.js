const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// Підключення до бази даних
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'Andrii',
    password: 'andrii01!',
    database: 'Restaurant'
});

const newPassword = 'adminpassword'; // Встановіть новий пароль для адміністратора
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error('Помилка хешування пароля:', err);
        return;
    }

    // Оновлення пароля в базі даних
    const query = 'UPDATE users SET password = ? WHERE username = "admin"';
    connection.query(query, [hash], (err) => {
        if (err) {
            console.error('Помилка оновлення пароля в базі даних:', err);
        } else {
            console.log('Пароль адміністратора успішно оновлено');
        }
        connection.end(); // Закриваємо з'єднання
    });
});
