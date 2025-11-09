function loadTodos() {
    const stored = localStorage.getItem('todos');
    return stored ? JSON.parse(stored) : [];
}

function saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    const todos = loadTodos();
    const todoListEl = document.getElementById("todo-list");
    todoListEl.innerHTML = "";

    todos.forEach((todo, index) => {
        const li = document.createElement("li");
        li.classList.add("todo-item");
        const checkbox = document.createElement("input");
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", () => {
            todos[index].done = checkbox.checked;
            saveTodos(todos);
            renderTodos();
        });

        const span = document.createElement("span");
        span.classList.add("todo-text");
        span.textContent = todo.text;
        if (todo.done) {
            span.classList.add("done-text");
        }

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "編集";
        editBtn.addEventListener("click", () => {
            const newText = prompt("新しい内容を入力してください:", todo.text);
            if (newText !== null) {
                todos[index].text = newText.trim();
                saveTodos(todos);
                renderTodos();
            }
        })

        const delBtn = document.createElement("button");
        delBtn.classList.add("delete-btn");
        delBtn.textContent = "消去";
        delBtn.addEventListener("click", () => {
            todos.splice(index, 1);
            saveTodos(todos);
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

function addTodo() {
    const text = inputEl.value.trim();
    if (text) {
        const todos = loadTodos();
        todos.push({ text: text, done: false });
        saveTodos(todos);
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
