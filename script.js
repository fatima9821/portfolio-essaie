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

// style le coin des chefs

// script.js
document.getElementById('recipe-form').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const recipeName = document.getElementById('recipe-name').value;
    const ingredients = document.getElementById('ingredients').value;
    const instructions = document.getElementById('instructions').value;
    const image = document.getElementById('image').files[0];
  
    const reader = new FileReader();
    reader.onload = function(e) {
      addRecipeToPage(recipeName, ingredients, instructions, e.target.result);
    };
  
    if (image) {
      reader.readAsDataURL(image);
    } else {
      addRecipeToPage(recipeName, ingredients, instructions, '');
    }
  
    // Réinitialiser le formulaire
    document.getElementById('recipe-form').reset();
  });
  
  function addRecipeToPage(name, ingredients, instructions, imageSrc) {
    const recipeList = document.getElementById('recipe-list');
  
    const recipeItem = document.createElement('div');
    recipeItem.classList.add('recipe-item');
  
    recipeItem.innerHTML = `
      <h3>${name}</h3>
      <p><strong>Ingrédients :</strong></p>
      <p>${ingredients}</p>
      <p><strong>Instructions :</strong></p>
      <p>${instructions}</p>
      ${imageSrc ? `<img src="${imageSrc}" alt="${name}" width="200">` : ''}
    `;
  
    recipeList.appendChild(recipeItem);
  }
  