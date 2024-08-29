const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON
app.use(express.json());

// Importer les routes
const routes = require('./routes');
app.use('/api', routes);

// Exemple de route
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
