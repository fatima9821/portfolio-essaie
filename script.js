// Exemples de données d'articles
const panier = [
    { id: 1, nom: "Lasagnes", prix: 15 },
    { id: 2, nom: "Sushis", prix: 20 },
    { id: 3, nom: "Pizza sauce bolognaise", prix: 12 },
    { id: 4, nom: "Boeuf mariné", prix: 18 },
    { id: 5, nom: "Salade composée", prix: 10 },
    { id: 6, nom: "Poulet pané", prix: 14 },
    { id: 7, nom: "Viande au four", prix: 22 },
    { id: 8, nom: "Poulet braisé", prix: 16 }
];

// Afficher les articles du panier
const panierItemsDiv = document.getElementById('panier-items');
panier.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.textContent = `${item.nom} - ${item.prix} €`;
    panierItemsDiv.appendChild(itemDiv);
});

// Action du bouton "Procéder au paiement"
const checkoutButton = document.getElementById('checkout-button');
checkoutButton.addEventListener('click', () => {
    alert('Procéder au paiement...');
    // Ici vous pouvez ajouter la logique pour le paiement
});