const API_URL = "http://localhost:3000/api/todos";

// Load todos from server
async function loadTodos() {
    const response = await fetch(API_URL);
    const data = await response.json();

    return data.map(row => ({
        id: row.task_id,
        text: row.content,
        done: row.is_completed === 1
    }));
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
        checkbox.addEventListener("change", async () => {
            await fetch(`${API_URL}/${todo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: todo.text, done: checkbox.checked })
            });
            renderTodos();
        });

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
        editBtn.addEventListener("click", async () => {
            const newText = prompt("新しい内容を入力してください:", todo.text);
            if (newText !== null) {
                await fetch(`${API_URL}/${todo.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: newText.trim(), done: todo.done })
                });
                renderTodos();
            }
        })

        const delBtn = document.createElement("button");
        delBtn.classList.add("delete-btn");
        delBtn.textContent = "消去";
        delBtn.addEventListener("click", async () => {
            await fetch(`${API_URL}/${todo.id}`, {
                method: 'DELETE'
            });
            renderTodos();
        });

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(buttonContainer);
        buttonContainer.appendChild(editBtn);
        buttonContainer.appendChild(delBtn);
        todoListEl.appendChild(li);
    });
}

// Add a new todo
async function addTodo() {
    const text = inputEl.value.trim();
    if (text) {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
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

renderTodos();
