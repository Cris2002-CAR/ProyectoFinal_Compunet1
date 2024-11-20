// Archivo: /public/app.js

// URL base del servidor
const BASE_URL = 'http://localhost:3000';

// Función para registrar un nuevo usuario
function signup() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  fetch(`${BASE_URL}/customer/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      alert('Registro exitoso');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      redirectUser(role);
    } else {
      alert(data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Función para iniciar sesión
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  const endpoint = role === 'admin' ? '/admin/login' : '/customer/login';

  fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      alert('Inicio de sesión exitoso');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
      redirectUser(role);
    } else {
      alert(data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Redirigir al usuario según su rol
function redirectUser(role) {
  if (role === 'admin') {
    window.location.href = 'admin.html';
  } else if (role === 'customer') {
    window.location.href = 'customer.html';
  }
}

// Función para que el administrador agregue un producto
function addProduct() {
  const token = localStorage.getItem('token');
  const name = document.getElementById('product-name').value;
  const description = document.getElementById('product-description').value;
  const price = document.getElementById('product-price').value;
  const quantity = document.getElementById('product-quantity').value;

  fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ name, description, price, quantity }),
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Función para cargar los productos disponibles para el cliente
function loadProducts() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión para ver los productos');
    return;
  }

  fetch(`${BASE_URL}/api/customer/products`, {
    method: 'GET',
    headers: {
      'Authorization': token,
    },
  })
  .then(response => response.json())
  .then(products => {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Limpiar la lista de productos
    products.forEach(product => {
      const productDiv = document.createElement('div');
      productDiv.textContent = `Nombre: ${product.name}, Precio: ${product.price}`;
      productList.appendChild(productDiv);
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Cargar los productos si el usuario ya está autenticado
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  if (role === 'customer') {
    loadProducts();
  }
});
