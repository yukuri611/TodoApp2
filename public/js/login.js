const API_BASE_URL = "http://localhost:3000/api";

const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = loginUsername.value;
    const password = loginPassword.value;

    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        alert("ログインに成功しました");
        const { token } = await response.json();
        localStorage.setItem("authToken", token);
        moveToMain();
    } else {
        alert("ログインに失敗しました");
    }
});


// move to main page
function moveToMain() {
    window.location.href = "todo.html";
}

// move to login page
function moveToLogin() {
    window.location.href = "login.html";
}
