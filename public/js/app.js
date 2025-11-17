const API_BASE_URL = "/api";
const API_URL = `${API_BASE_URL}/todos`;

const authContainer = document.getElementById("auth-container");
const todoContainer = document.getElementById('todo-container');
const logoutBtn = document.getElementById('logout-btn');

const inputEl = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");


// move to login page
function moveToLogin() {
    window.location.href = "login.html";
}


// Load todos from server
async function loadTodos() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        alert("ログインしてください");
        moveToLogin();
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
            moveToLogin();
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
        moveToLogin();
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
        moveToLogin();
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
        moveToLogin();
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
        moveToLogin(); // 認証画面に戻す
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
        editBtn.textContent = "修正";
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

addBtn.addEventListener('click', addTodo);
inputEl.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        addTodo();
    }
});

// logout button
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    alert("ログアウトしました。");
    moveToLogin();
});



renderTodos();
