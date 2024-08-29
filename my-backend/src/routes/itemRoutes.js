const express = require('express');
const router = express.Router();
const db = require('./db');

// Route pour récupérer tous les éléments
router.get('/items', (req, res) => {
    db.query('SELECT * FROM items', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Route pour ajouter un nouvel élément
router.post('/items', (req, res) => {
    const { name, description } = req.body;
    db.query('INSERT INTO items (name, description) VALUES (?, ?)', [name, description], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: results.insertId });
    });
});

module.exports = router;
