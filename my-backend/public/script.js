

// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Gestion du formulaire de recette
    const recipeForm = document.getElementById('recipe-form');
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(event) {
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
  
            // Réinitialiser le formulaire après soumission
            recipeForm.reset();
        });
    } else {
        console.error("Le formulaire de recette n'a pas été trouvé.");
    }
  
    // Gestion du bouton hamburger
    const hamburgerButton = document.getElementById('hamburger');
    if (hamburgerButton) {
        hamburgerButton.addEventListener('click', function() {
            console.log("Le bouton hamburger a été cliqué !");
        });
    }
  
    // Si nécessaire, gestion de la redirection après soumission du formulaire
    const formRedirect = document.getElementById('recipe-form'); // Assurer que l'ID du formulaire est correct
    if (formRedirect) {
        formRedirect.addEventListener('submit', function(event) {
            event.preventDefault();
            window.location.href = 'recettespartager.html';  // Rediriger vers une autre page après soumission
        });
    }
  });
  
  // Fonction pour ajouter la recette sur la page
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
  