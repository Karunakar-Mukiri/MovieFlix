document.addEventListener('DOMContentLoaded', () => {
    const addMovieBtn = document.getElementById('add-movie-btn');
    const addMovieFormContainer = document.getElementById('add-movie-form-container');
    const cancelAddMovieBtn = document.getElementById('cancel-add-movie-btn');

    if (addMovieBtn) {
        addMovieBtn.addEventListener('click', () => {
            addMovieFormContainer.style.display = 'block';
            addMovieBtn.style.display = 'none';
        });
    }

    if (cancelAddMovieBtn) {
        cancelAddMovieBtn.addEventListener('click', () => {
            addMovieFormContainer.style.display = 'none';
            addMovieBtn.style.display = 'block';
        });
    }
});