const API_BASE_URL = "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/todos`;

const authContainer = document.getElementById("auth-container");
const todoContainer = document.getElementById('todo-container');
const logoutBtn = document.getElementById('logout-btn');

const registerForm = document.getElementById('register-form');
const registerUsername = document.getElementById('register-username');
const registerPassword = document.getElementById('register-password');
const registerMessage = document.getElementById('register-message');

const loginForm = document.getElementById('login-form');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginMessage = document.getElementById('login-message');

async function handleLogin(username, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        const { token } = await response.json();
        localStorage.setItem("authToken", token);
        showTodoApp();
    } else {
        loginMessage.textContent = "ログインに失敗しました";
    }
}

// Load todos from server
async function loadTodos() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        showAuthUI();
        return [];
    }

    const response = await fetch(API_URL, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            alert("セッションが切れました。再度ログインしてください。");
            localStorage.removeItem('authToken');
            showAuthUI();
        }
        return [];
    }
    const data = await response.json();

    return data.map(row => ({
        id: row.task_id,
        text: row.content,
        done: row.is_completed === 1
    }));
}

// handle checkbox
async function handleToggle(todo, isDone) {
    const token = localStorage.getItem("authToken");
    if (!token) {
        showAuthUI();
        return;
    }

    const response = await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text: todo.text, done: isDone })
    });

    if (!response.ok) {
        handleApiError(response);
        return;
    }
    renderTodos();
}

// edit button handler
async function handleEdit(todo) {
    const newText = prompt("新しい内容を入力してください:", todo.text);
    if (newText === null || newText.trim() === todo.text) {
        return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
        showAuthUI();
        return;
    }

    const response = await fetch(`${API_URL}/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ text: newText.trim(), done: todo.done })
    });

    if (!response.ok) {
        handleApiError(response);
        return;
    }
    renderTodos();
}

// delete button handler
async function handleDelete(todo) {
    if (!confirm(`「${todo.text}」を削除しますか？`)) {
        return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
        showAuthUI();
        return;
    }

    const response = await fetch(`${API_URL}/${todo.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        handleApiError(response);
        return;
    }
    renderTodos();
}


function handleApiError(response) {
    if (response.status === 401 || response.status === 403) {
        alert("セッションが切れました。再度ログインしてください。");
        showAuthUI(); // 認証画面に戻す
    } else {
        alert("エラーが発生しました。");
    }
}

// Show todos in the UI
async function renderTodos() {
    const todos = await loadTodos();
    const todoListEl = document.getElementById("todo-list");
    todoListEl.innerHTML = "";


    todos.forEach((todo) => {
        const li = document.createElement("li");
        li.classList.add("todo-item");

        //checkbox
        const checkbox = document.createElement("input");
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", () => handleToggle(todo, checkbox.checked));

        //text
        const span = document.createElement("span");
        span.classList.add("todo-text");
        span.textContent = todo.text;
        if (todo.done) {
            span.classList.add("done-text");
        }

        //edit button
        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "編集";
        editBtn.addEventListener("click", () => handleEdit(todo));

        //delete button
        const delBtn = document.createElement("button");
        delBtn.classList.add("delete-btn");
        delBtn.textContent = "消去";
        delBtn.addEventListener("click", () => handleDelete(todo));

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(delBtn);
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(buttonContainer);
        todoListEl.appendChild(li);
    });

}


// Add a new todo
async function addTodo() {
    const text = inputEl.value.trim();
    if (text) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            alert("ログインしてください");
            return;
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ text: text })
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("セッションが切れました。再度ログインしてください。");
                localStorage.removeItem('authToken');
                // redirect to login page
            }
            return;
        }
        renderTodos();
        inputEl.value = "";
    }
}

const inputEl = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");

addBtn.addEventListener('click', addTodo);
inputEl.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        addTodo();
    }
});


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

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginMessage.textContent = "";
    handleLogin(loginUsername.value, loginPassword.value);
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    showAuthUI();
});


function showTodoApp() {
    authContainer.style.display = 'none';
    todoContainer.style.display = 'block';
    renderTodos();
}

function showAuthUI() {
    authContainer.style.display = 'block';
    todoContainer.style.display = 'none';
    document.getElementById("todo-list").innerHTML = "";
}

function initializeApp() {
    const token = localStorage.getItem('authToken');
    if (token) {
        showTodoApp();
    } else {
        showAuthUI();
    }
}

initializeApp();
