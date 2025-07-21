document.addEventListener('DOMContentLoaded', () => {
    const roleSelection = document.getElementById('role-selection');
    const formWrapper = document.getElementById('form-wrapper');
    const userRoleBtn = document.getElementById('user-role-btn');
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const backBtn = document.getElementById('back-to-roles');
    const formTitle = document.getElementById('form-title');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const toggleLink = document.getElementById('toggle-link');
    const toggleLinkP = document.getElementById('toggle-link-p');
    const messageArea = document.getElementById('message-area');

    let currentRole = 'user';
    let isLoginView = true;

    function showFormView(role) {
        currentRole = role;
        roleSelection.style.display = 'none';
        formWrapper.style.display = 'block';
        formTitle.textContent = `${role.charAt(0).toUpperCase() + role.slice(1)} Login`;
        
        // Admin can only log in, not sign up
        if (role === 'admin') {
            toggleLinkP.style.display = 'none';
            if (!isLoginView) toggleForms(); // Switch to login if on signup view
        } else {
            toggleLinkP.style.display = 'block';
        }
    }

    function showRoleSelection() {
        formWrapper.style.display = 'none';
        roleSelection.style.display = 'block';
        messageArea.textContent = '';
    }

    function toggleForms() {
        isLoginView = !isLoginView;
        if (isLoginView) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            toggleLink.textContent = "Don't have an account? Sign Up";
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            toggleLink.textContent = 'Already have an account? Login';
        }
    }

    userRoleBtn.addEventListener('click', () => showFormView('user'));
    adminRoleBtn.addEventListener('click', () => showFormView('admin'));
    backBtn.addEventListener('click', showRoleSelection);
    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        toggleForms();
    });

    async function handleFormSubmit(e, url) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        data.role = currentRole;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            window.location.href = result.role === 'admin' ? '/admin/dashboard' : '/home';
        } else {
            messageArea.textContent = result.message;
            messageArea.style.color = 'var(--color-error)';
        }
    }

    loginForm.addEventListener('submit', (e) => handleFormSubmit(e, '/api/login'));
    signupForm.addEventListener('submit', (e) => handleFormSubmit(e, '/api/signup'));
});