require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const nodemailer = require('nodemailer'); // Ajouter nodemailer pour l'envoi d'email
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const app = express();

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Dossier où les images seront stockées
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, Date.now() + path.extname(file.originalname)); // Nom unique pour chaque fichier
  }
});

const upload = multer({ storage: storage });

// Middleware pour analyser les corps de requêtes JSON
app.use(express.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));  // ou 'frontend', selon le nom du dossier
app.use(express.urlencoded({ extended: true })); // Pour traiter les données des formulaires
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
      text: `Bonjour ${firstname},\n\nVotre réservation pour le ${day} à ${time} a été confirmée. Nous avons hâte de vous accueillir !`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
      } else {
        console.log('Email de vérification envoyé : ' + info.response);
      }
    });
  }

  // Middleware pour vérifier si l'utilisateur est un admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send('Accès refusé : administrateurs uniquement');
  }
  next();
}

  function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user;
        next();
    } catch (err) {
        console.error('Erreur de vérification du token:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Token expiré' });
        }
        return res.status(403).json({ message: 'Token invalide' });
    }
  }

  app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self' https://www.gstatic.com; script-src 'self' https://cdn.jsdelivr.net");
  next();
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

// Middleware pour vérifier si l'utilisateur est un admin
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).send('Accès refusé : administrateurs uniquement');
  }
  next();
}

// Route pour gérer les réservations
app.post('/reservation', (req, res) => {
  console.log(req.body); 
  const { firstname, lastname, email, date, time, phone, guests, services, message } = req.body;


  if (!firstname || !lastname || !email || !date || !phone || !time || !guests || !services || !message) {
    return res.status(400).send('Tous les champs sont requis');
  }

  // Insertion des données de réservation dans MySQL
  const sql = "INSERT INTO reservations (firstname, lastname, email, date, phone, time, guests, services, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(sql, [firstname, lastname, email, date, phone, time, guests, services, message], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion dans la base de données', err);
      return res.status(500).send('Erreur du serveur');
    }

    // Envoi de l'email de confirmation
    sendConfirmationEmail(firstname, email, date, time);

    res.send('Réservation enregistrée avec succès. Un email de confirmation vous a été envoyé.');
  });
});

// Route pour l'inscription sans vérification par email
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);  // Ajoute cette ligne pour voir ce que le serveur reçoit

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });  // Utiliser JSON pour l'erreur
  }

  // Vérifier si l'email existe déjà
  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  connection.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      console.error('Erreur lors de la vérification de l\'email :', err);
      return res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });  // Envoie un message en JSON
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Si l'email n'existe pas, continuer avec l'inscription
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Erreur lors du hachage du mot de passe :', err);
        return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });  // Envoie un message en JSON
      }

      const token = crypto.randomBytes(32).toString('hex');

      const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
      connection.query(sql, [username, email, hash, 'user'], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'insertion dans la base de données :', err.sqlMessage || err);
          return res.status(500).json({ message: 'Erreur lors de l\'inscription' }); 
        }

        // Message de succès sans vérification de mail
        return res.status(200).json({ message: 'Inscription réussie !' });  // Envoie un message en JSON
      });
    });
  });
});


// Route pour la connexion avec génération du token JWT
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Vérification de l'utilisateur dans la base de données
        const sql = "SELECT * FROM users WHERE email = ?";
        connection.query(sql, [email], (err, results) => {
            if (err) {
                console.error('Erreur lors de la requête SQL :', err);
                return res.status(500).json({ message: 'Erreur du serveur' });
            }

            // Si aucun utilisateur n'a été trouvé
            if (results.length === 0) {
                return res.status(400).json({ message: 'Utilisateur non trouvé' });
            }

            const user = results[0];

            // Comparer le mot de passe soumis avec celui dans la base de données
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) {
                    console.error('Erreur lors de la comparaison des mots de passe :', err);
                    return res.status(500).json({ message: 'Erreur du serveur' });
                }

                // Si les mots de passe ne correspondent pas
                if (!match) {
                    return res.status(400).json({ message: 'Mot de passe incorrect' });
                }

                // Génération du token JWT une fois que l'utilisateur est validé
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role },
                    process.env.JWT_SECRET,  // Utilise la clé secrète définie dans le fichier .env
                    { expiresIn: '1h' }  // Le token expire dans 1 heure
                );

                // Ajouter le token dans un cookie sécurisé
                res.cookie('token', token, {
                    httpOnly: true, // Cookie non accessible via JavaScript (meilleure sécurité)
                    secure: false, // Met à true si tu es en HTTPS
                    maxAge: 3600000 // Expire après 1 heure
                });

                // Envoi du token sans 'Bearer'
                res.json({ 
                    message: 'Connexion réussie',
                    token: token 
                });
            });
        });
    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});


// Route pour publier une recette avec une image
app.post('/recipes', authenticateToken, upload.single('image'), (req, res) => {
    try {
        console.log('Données reçues:', req.body); // Debug
        console.log('Fichier reçu:', req.file); // Debug
        console.log('Utilisateur:', req.user); // Debug

        const { title, ingredients, instructions } = req.body;
        const userId = req.user.id;
        const imagePath = req.file ? req.file.filename : null;

        const sql = `
            INSERT INTO recipes (title, ingredients, instructions, image, user_id) 
            VALUES (?, ?, ?, ?, ?)
        `;

        connection.query(sql, [title, ingredients, instructions, imagePath, userId], 
            (err, result) => {
                if (err) {
                    console.error('Erreur SQL:', err);
                    return res.status(500).json({ message: 'Erreur lors de l\'insertion' });
                }
                
                console.log('Recette insérée:', result); // Debug
                res.status(201).json({ 
                    message: 'Recette créée avec succès',
                    recipeId: result.insertId 
                });
            }
        );

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


// Route pour récupérer toutes les recettes
app.get('/recipes', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.username 
            FROM recipes r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `;
        
        connection.query(query, (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des recettes:', err);
                return res.status(500).json({ 
                    message: 'Erreur lors de la récupération des recettes',
                    error: err.message 
                });
            }
            
            console.log('Recettes trouvées:', results.length); // Debug
            res.json(results);
        });
        
    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ 
            message: 'Erreur serveur',
            error: error.message 
        });
    }
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



// Route pour récupérer des recettes filtrées par titre ou ingrédient
app.post('/recipes/search', (req, res) => {
    try {
        const { query } = req.body;
        console.log('Recherche de:', query);

        if (!query) {
            return res.status(400).json({ message: 'Terme de recherche requis' });
        }

        const searchTerm = `%${query}%`;
        const sqlQuery = `
            SELECT r.*, u.username 
            FROM recipes r 
            LEFT JOIN users u ON r.user_id = u.id 
            WHERE r.title LIKE ? 
            OR r.ingredients LIKE ? 
            OR r.instructions LIKE ?
            ORDER BY r.created_at DESC
        `;

        connection.query(sqlQuery, [searchTerm, searchTerm, searchTerm], (err, results) => {
            if (err) {
                console.error('Erreur SQL:', err);
                return res.status(500).json({ message: 'Erreur lors de la recherche' });
            }
            
            console.log('Résultats trouvés:', results.length);
            res.json(results);
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
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

// Route pour gérer le formulaire de contact
app.post('/contact', (req, res) => {
  const { fullname, email, message } = req.body;

  // Validation des champs
  if (!fullname || !email || !message) {
    return res.status(400).send('Tous les champs sont requis');
  }

  // Insertion des données de contact dans la base de données
  const sql = "INSERT INTO contacts (fullname, email, message) VALUES (?, ?, ?)";
  connection.query(sql, [fullname, email, message], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion dans la base de données', err);
      return res.status(500).send('Erreur du serveur');
    }

    // Préparer l'email à envoyer
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECEIVER, // L'adresse où tu veux recevoir les messages de contact
      subject: 'Nouveau message du formulaire de contact',
      text: `Nom complet : ${fullname}\nEmail : ${email}\nMessage : ${message}`
    };

    // Envoi de l'email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi du message de contact :', error);
        return res.status(500).send('Erreur lors de l\'envoi du message');
      } else {
        res.status(200).send('Votre message a été envoyé avec succès et enregistré dans la base de données.');
      }
    });
  });
});
  
  // Le serveur écoute sur le port 3000
  const port = 4011;
  app.listen(port, () => {
    console.log('Serveur en écoute sur le port 4011');
  });

  // Configuration pour servir les fichiers statiques
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Assurez-vous que le dossier uploads existe
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');

  if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
  }