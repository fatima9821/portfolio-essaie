const mysql = require('mysql2');

// Créer une connexion à la base de données
const connection = mysql.createConnection({
    host: 'localhost',       // Adresse du serveur MySQL
    user: 'root',            // Nom d'utilisateur MySQL
    password: 'your_password', // Mot de passe MySQL
    database: 'mydatabase'   // Nom de votre base de données
});

// Connecter à la base de données
connection.connect(err => {
    if (err) {
        console.error('Erreur de connexion : ' + err.stack);
        return;
    }
    console.log('Connecté en tant que ID ' + connection.threadId);
});

module.exports = connection;
