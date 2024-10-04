require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer'); // Ajouter nodemailer pour l'envoi d'email
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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

  function sendVerificationEmail(username, email, token) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Vérification de votre email',
      text: `Bonjour ${username},\n\nVeuillez vérifier votre email en cliquant sur le lien suivant :\n\nhttp://localhost:4011/verify-email?token=${token}\n\nMerci !`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
      } else {
        console.log('Email de vérification envoyé : ' + info.response);
      }
    });
  }
  
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

// Route pour l'inscription
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('Tous les champs sont requis');
  }

   // Vérifier si l'email existe déjà
   const checkEmailSql = "SELECT * FROM users WHERE email = ?";
   connection.query(checkEmailSql, [email], (err, results) => {
     if (err) {
       console.error('Erreur lors de la vérification de l\'email :', err.sqlMessage || err);  // Log l'erreur SQL exacte
       return res.status(500).send('Erreur lors de la vérification de l\'email');
     }
 
     if (results.length > 0) {
       return res.status(400).send('Cet email est déjà utilisé');
     }
 
     // Si l'email n'existe pas, continuer avec l'inscription
     bcrypt.hash(password, 10, (err, hash) => {
       if (err) {
         console.error('Erreur lors du hachage du mot de passe :', err);
         return res.status(500).send('Erreur lors du hachage du mot de passe');
       }

    // Ajout d'un rôle par défaut 'user'
       const role = 'user'; // Les utilisateurs normaux auront le rôle 
 
       // Générer un token unique
       const token = crypto.randomBytes(32).toString('hex');
 
       const sql = "INSERT INTO users (username, email, password, token) VALUES (?, ?, ?, ?)";
       connection.query(sql, [username, email, hash, token], (err, result) => {
         if (err) {
           console.error('Erreur lors de l\'insertion dans la base de données :', err.sqlMessage || err);  // Log l'erreur SQL exacte
           return res.status(500).send('Erreur lors de l\'inscription');
         }
 
         // Envoi de l'email de vérification
         sendVerificationEmail(username, email, token);
 
         res.send('Inscription réussie, veuillez vérifier votre email');
       });
     });
   });
 });

// Route pour la connexion avec génération du token JWT
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Vérification de l'utilisateur dans la base de données
  const sql = "SELECT * FROM users WHERE email = ?";
  connection.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Erreur lors de la requête SQL :', err);
      return res.status(500).json({ message: 'Erreur du serveur' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        console.error('Erreur lors de la comparaison des mots de passe :', err);
        return res.status(500).json({ message: 'Erreur du serveur' });
      }

      if (!match) {
        return res.status(400).json({ message: 'Mot de passe incorrect' });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,  // Utilise la clé secrète définie dans le fichier .env
        { expiresIn: '1h' }  // Le token expire dans 1 heure
      );

      // Envoi du token dans la réponse
      return res.status(200).json({
        message: 'Connexion réussie',
        token: token
      });
    });
  });
});

// Route pour publier une recette
app.post('/recipes', authenticateToken, (req, res) => {
  const { title, ingredients, instructions } = req.body;
  const userId = req.user.id; // Récupéré à partir du token

  // Insertion de la recette dans la base de données
  const sql = "INSERT INTO recipes (user_id, title, ingredients, instructions) VALUES (?, ?, ?, ?)";
  connection.query(sql, [userId, title, ingredients, instructions], (err, result) => {
    if (err) {
      return res.status(500).send('Erreur lors de la publication de la recette');
    }
    
    // Retourner une réponse claire après l'insertion
    res.status(200).json({
      message: 'Recette publiée avec succès',
      recipeId: result.insertId  // Renvoie l'ID de la recette insérée si besoin
    });
  });
});


// Route pour récupérer toutes les recettes
app.get('/recipes', (req, res) => {
  const sql = `
    SELECT r.id, r.title, r.ingredients, r.instructions, u.username 
    FROM recipes r 
    JOIN users u ON r.user_id = u.id
  `;
  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send('Erreur lors de la récupération des recettes');
    }
    res.json(results);
  });
});

app.get('/verify-email', (req, res) => {
  const { token } = req.query; // Le token est récupéré dans l'URL

  const sql = "SELECT * FROM users WHERE token = ?";
  connection.query(sql, [token], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).send('Lien de vérification invalide');
    }

    // Si le token est valide, on marque l'utilisateur comme vérifié
    const updateSql = "UPDATE users SET is_verified = TRUE, token = NULL WHERE token = ?";
    connection.query(updateSql, [token], (err, result) => {
      if (err) {
        return res.status(500).send('Erreur lors de la vérification');
      }
      res.send('Votre email a été vérifié avec succès');
    });
  });
});

// Route pour mettre à jour une recette
app.put('/recipes/:id', authenticateToken, isAdmin, (req, res) => {
  const { title, ingredients, instructions } = req.body;
  const { id } = req.params;

  // Vérifie que tous les champs sont présents
  if (!title || !ingredients || !instructions) {
    return res.status(400).send('Tous les champs sont requis');
  }

  // Requête SQL pour mettre à jour la recette
  const sql = "UPDATE recipes SET title = ?, ingredients = ?, instructions = ? WHERE id = ?";
  connection.query(sql, [title, ingredients, instructions, id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la recette :', err);
      return res.status(500).send('Erreur lors de la mise à jour de la recette');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Recette non trouvée');
    }

    res.send('Recette mise à jour avec succès');
  });
});

// Route pour supprimer une recette
app.delete('/recipes/:id', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;

  // Requête SQL pour supprimer la recette
  const sql = "DELETE FROM recipes WHERE id = ?";
  connection.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de la recette :', err);
      return res.status(500).send('Erreur lors de la suppression de la recette');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Recette non trouvée');
    }

    res.send('Recette supprimée avec succès');
  });
});

// Middleware de vérification du token
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) return res.status(401).send('Token manquant');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Token invalide');
    req.user = user;
    next();
  });
}

// Middleware pour vérifier si l'utilisateur est un admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send('Accès refusé : administrateurs uniquement');
  }
  next();
}
// Protéger la route de publication des recettes
app.post('/recipes', authenticateToken, (req, res) => {
  const { title, ingredients, instructions } = req.body;
  const userId = req.user.id; // Récupéré à partir du token

  // Insertion de la recette dans la base de données
  const sql = "INSERT INTO recipes (user_id, title, ingredients, instructions) VALUES (?, ?, ?, ?)";
  connection.query(sql, [userId, title, ingredients, instructions], (err, result) => {
    if (err) {
      return res.status(500).send('Erreur lors de la publication de la recette');
    }
    res.send('Recette publiée avec succès');
  });
});

// Route pour récupérer des recettes filtrées par titre ou ingrédient
app.get('/recipes/search', (req, res) => {
  const { title, ingredient } = req.query;

  let sql = "SELECT r.id, r.title, r.ingredients, r.instructions, u.username FROM recipes r JOIN users u ON r.user_id = u.id WHERE 1=1";
  
  if (title) {
    sql += ` AND r.title LIKE '%${title}%'`;
  }
  if (ingredient) {
    sql += ` AND r.ingredients LIKE '%${ingredient}%'`;
  }

  connection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send('Erreur lors de la récupération des recettes');
    }
    res.json(results);
  });
});

// Route pour ajouter un commentaire sur une recette
app.post('/recipes/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params; // ID de la recette
  const { comment } = req.body;
  const userId = req.user.id; // Récupéré à partir du token

  if (!comment) {
    return res.status(400).send('Le commentaire est requis');
  }

  const sql = "INSERT INTO comments (user_id, recipe_id, comment) VALUES (?, ?, ?)";
  connection.query(sql, [userId, id, comment], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout du commentaire :', err);
      return res.status(500).send('Erreur lors de l\'ajout du commentaire');
    }
    res.send('Commentaire ajouté avec succès');
  });
});

// Route pour récupérer les commentaires d'une recette
app.get('/recipes/:id/comments', (req, res) => {
  const { id } = req.params; // ID de la recette

  const sql = `
    SELECT c.comment, c.created_at, u.username 
    FROM comments c 
    JOIN users u ON c.user_id = u.id
    WHERE c.recipe_id = ?
  `;
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des commentaires :', err);
      return res.status(500).send('Erreur lors de la récupération des commentaires');
    }
    res.json(results);
  });
});
  
  // Le serveur écoute sur le port 3000
  const port = 4011;
  app.listen(port, () => {
    console.log('Serveur en écoute sur le port 4011');
  });