document.addEventListener('DOMContentLoaded', () => {
    const darkModeButton = document.getElementById('darkModeToggle');
    
    if (darkModeButton) {
        const icon = darkModeButton.querySelector('i');
        
        // Vérifier le thème actuel
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.className = 'las la-sun';
            darkModeButton.innerHTML = '<i class="las la-sun"></i> Mode Clair';
        }

        // Gérer le clic sur le bouton
        darkModeButton.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                darkModeButton.innerHTML = '<i class="las la-moon"></i> Mode Sombre';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                darkModeButton.innerHTML = '<i class="las la-sun"></i> Mode Clair';
            }
        });
    }
});