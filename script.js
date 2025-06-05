
const API_BASE_URL = 'https://todoapp-backend-0j62.onrender.com/api';

let currentUser = null;
let authToken = null;
let todos = [];
let filterState = 'all';
let isLoginMode = true;

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function setAuthToken(token) {
    authToken = token;
    localStorage.setItem('authToken', token);
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function setCurrentUser(username) {
    currentUser = username;
    localStorage.setItem('currentUser', username);
}

function showMessage(message, isError = false) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = message;
    messageEl.className = isError ? 'error-message' : 'success-message';
    setTimeout(() => {
        messageEl.textContent = '';
        messageEl.className = '';
    }, 5000);
}

async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (response.status === 401) {
            clearAuthToken();
            showAuthScreen();
            throw new Error('Unauthorized');
        }

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

async function login(username, password) {
    try {
        const result = await apiCall('/auth/login', 'POST', { username, password });
        setAuthToken(result.token);
        setCurrentUser(username);
        return result;
    } catch (error) {
        throw error;
    }
}

async function register(username, password) {
    try {
        const result = await apiCall('/auth/register', 'POST', { username, password });
        return result;
    } catch (error) {
        throw error;
    }
}

async function fetchTodos() {
    try {
        const result = await apiCall('/todos');
        todos = result;
        return result;
    } catch (error) {
        throw error;
    }
}

async function createTodo(text) {
    try {
        const result = await apiCall('/todos', 'POST', { text });
        return result;
    } catch (error) {
        throw error;
    }
}

async function updateTodo(id, updates) {
    try {
        const result = await apiCall(`/todos/${id}`, 'PUT', updates);
        return result;
    } catch (error) {
        throw error;
    }
}

async function deleteTodo(id) {
    try {
        const result = await apiCall(`/todos/${id}`, 'DELETE');
        return result;
    } catch (error) {
        throw error;
    }
}

function showAuthScreen() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('todo-app').style.display = 'none';
}

function showTodoApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('todo-app').style.display = 'flex';
    document.getElementById('current-user').textContent = currentUser;
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (isLoginMode) {
        title.textContent = 'Login';
        submitBtn.textContent = 'Login';
        toggleText.textContent = "Don't have an account? ";
        toggleLink.textContent = 'Sign up';
    } else {
        title.textContent = 'Sign Up';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account? ';
        toggleLink.textContent = 'Login';
    }
    
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('auth-message').textContent = '';
}

function displayTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

    const filteredTodos = todos.filter(todo => {
        if (filterState === 'completed') return todo.completed;
        if (filterState === 'pending') return !todo.completed;
        return true; 
    });

    filteredTodos.forEach(todo => {
        const todoElement = document.createElement('li');
        todoElement.setAttribute('data-id', todo.id);

        const textElement = document.createElement('div');
        textElement.textContent = todo.text;
        textElement.classList.add('textElement');
        if (todo.completed) textElement.classList.add('todoCompletedBtn');

        const wrapper = document.createElement('div');
        wrapper.classList.add('wrapper');

        const editButton = document.createElement('button');
        editButton.classList.add('edit-button');
        editButton.innerText = 'Edit';
        editButton.addEventListener('click', () => editTodoHandler(todo.id));

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => deleteTodoHandler(todo.id));

        const completeButton = document.createElement('button');
        completeButton.classList.add('complete-button');
        completeButton.innerText = todo.completed ? 'Reset' : 'Complete';
        completeButton.addEventListener('click', () => toggleTodoHandler(todo.id));

        wrapper.appendChild(editButton);
        wrapper.appendChild(deleteButton);
        wrapper.appendChild(completeButton);

        todoElement.appendChild(textElement);
        todoElement.appendChild(wrapper);

        todoList.appendChild(todoElement);
    });
}

async function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        showMessage('Please fill in all fields', true);
        return;
    }

    try {
        if (isLoginMode) {
            await login(username, password);
            await loadTodos();
            showTodoApp();
        } else {
            await register(username, password);
            showMessage('Account created successfully! Please login.');
            toggleAuthMode();
        }
    } catch (error) {
        showMessage(error.message, true);
    }
}

async function loadTodos() {
    try {
        await fetchTodos();
        displayTodos();
    } catch (error) {
        console.error('Failed to load todos:', error);
    }
}

async function addNewTodo() {
    const textInput = document.getElementById('todoTextInput');
    const todoText = textInput.value.trim();
    
    if (!todoText) {
        alert('Please enter a todo');
        return;
    }

    try {
        await createTodo(todoText);
        textInput.value = '';
        await loadTodos();
    } catch (error) {
        alert('Failed to add todo: ' + error.message);
    }
}

async function editTodoHandler(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const newText = prompt("Enter new todo value", todo.text);
    if (newText === null || newText.trim() === '') return;

    try {
        await updateTodo(id, { text: newText.trim() });
        await loadTodos();
    } catch (error) {
        alert('Failed to update todo: ' + error.message);
    }
}

async function deleteTodoHandler(id) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        await deleteTodo(id);
        await loadTodos();
    } catch (error) {
        alert('Failed to delete todo: ' + error.message);
    }
}

async function toggleTodoHandler(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
        await updateTodo(id, { completed: !todo.completed });
        await loadTodos();
    } catch (error) {
        alert('Failed to update todo: ' + error.message);
    }
}

function handleFilter(event) {
    if (event.target.classList.contains('filterBtn')) {
        document.querySelectorAll('.filterBtn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        event.target.classList.add('active');
        
        filterState = event.target.getAttribute('data-filter');
        displayTodos();
    }
}

function logout() {
    clearAuthToken();
    currentUser = null;
    todos = [];
    showAuthScreen();
}

document.addEventListener('DOMContentLoaded', () => {
    const token = getAuthToken();
    const savedUser = getCurrentUser();
    
    if (token && savedUser) {
        authToken = token;
        currentUser = savedUser;
        showTodoApp();
        loadTodos();
    } else {
        showAuthScreen();
    }

    document.getElementById('auth-submit').addEventListener('click', handleAuth);
    document.getElementById('auth-toggle-link').addEventListener('click', toggleAuthMode);
    
    document.getElementById('username').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAuth();
    });
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAuth();
    });

    document.getElementById('submitButton').addEventListener('click', addNewTodo);
    document.getElementById('todoTextInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTodo();
    });
    document.getElementById('filter-btn').addEventListener('click', handleFilter);
    document.getElementById('logout-btn').addEventListener('click', logout);
});