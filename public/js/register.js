const API_BASE_URL = "http://localhost:3000/api";

const registerForm = document.getElementById('register-form');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerMessage = document.getElementById('register-message');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = registerUsername.value;
    const password = registerPassword.value;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            registerMessage.textContent = "登録が完了しました。ログインしてください。";
            registerMessage.style.color = 'green';
            registerForm.reset();
        } else {
            registerMessage.textContent = data.message;
            registerMessage.style.color = 'red';
        }
    } catch (err) {
        registerMessage.textContent = "登録中にエラーが発生しました。";
    }
});
