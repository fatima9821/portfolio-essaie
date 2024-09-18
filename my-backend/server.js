require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const app = express();

// Middleware pour analyser les corps de requêtes JSON
app.use(express.json()); 

// Debug: Afficher les variables d'environnement
/*console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);*/

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connexion à MySQL
connection.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à MySQL :', err);
      return;
    }
    console.log('Connecté à MySQL !');
  });
  
  // Route principale (page d'accueil)
app.get('/', (req, res) => {
  res.send('Bienvenue sur le backend de TUNDE, votre site de cuisine!');
});

// Exemple de route pour récupérer toutes les recettes
app.get('/recettes', (req, res) => {
  const query = 'SELECT * FROM recettes'; // Modifiez cette requête pour correspondre à votre base de données
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Erreur lors de la récupération des recettes');
    }
    res.json(results); // Renvoie les résultats sous forme de JSON
  });
});
  
  // Le serveur écoute sur le port 3000
  const port = 4011;
  app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
  });  