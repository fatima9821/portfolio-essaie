
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
  
  document.getElementById('hamburger').addEventListener('click', function() {
    console.log("Le bouton hamburger a été cliqué !");
  });
  
  document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    window.location.href = 'confirmation.html'; // Remplace par le lien de ta page de confirmation
});
/*qsn*/