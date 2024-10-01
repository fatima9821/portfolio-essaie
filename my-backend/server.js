require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer'); // Ajouter nodemailer pour l'envoi d'email
const app = express();

// Middleware pour analyser les corps de requêtes JSON
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Pour traiter les données des formulaires

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

// Fonction pour envoyer un email de confirmation
function sendConfirmationEmail(name, email, date, time) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Assure-toi que ces variables sont dans ton fichier .env
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Confirmation de votre réservation',
    text: `Bonjour ${name},\n\nVotre réservation pour le ${date} à ${time} a été confirmée. Nous avons hâte de vous accueillir !`
  };  

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email :', error);
    } else {
      console.log('Email envoyé : ' + info.response);
    }
  });
}

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

// Route pour gérer les réservations
app.post('/reservation', (req, res) => {
  const { name, email, date, time, guests } = req.body;

  if (!name || !email || !date || !time || !guests) {
    return res.status(400).send('Tous les champs sont requis');
  }

  // Insertion des données de réservation dans MySQL
  const sql = "INSERT INTO reservations (name, email, date, time, guests) VALUES (?, ?, ?, ?, ?)";
  connection.query(sql, [name, email, date, time, guests], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion dans la base de données', err);
      return res.status(500).send('Erreur du serveur');
    }

    // Envoi de l'email de confirmation
    sendConfirmationEmail(name, email, date, time);

    res.send('Réservation enregistrée avec succès. Un email de confirmation vous a été envoyé.');
  });
});
  
  // Le serveur écoute sur le port 3000
  const port = 4011;
  app.listen(port, () => {
    console.log('Serveur en écoute sur le port 4011');
  });