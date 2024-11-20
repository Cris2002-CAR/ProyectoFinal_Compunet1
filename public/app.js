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

// Función para ir a la página del carrito
function goToCart() {
  window.location.href = 'cart.html';
}

// Función para regresar a la página de productos
function goToProducts() {
  window.location.href = 'customer.html';
}

// Función para que el cliente vea los productos y agregue al carrito
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
      productDiv.innerHTML = `
        <p>Nombre: ${product.name}</p>
        <p>Precio: ${product.price}</p>
        <button onclick="addToCart(${product.id})">Agregar al Carrito</button>
      `;
      productList.appendChild(productDiv);
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Función para agregar un producto al carrito
function addToCart(productId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión para agregar productos al carrito');
    return;
  }

  fetch(`${BASE_URL}/api/customer/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ productId, quantity: 1 }),
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Función para cargar los productos del carrito en la página del carrito
function loadCartItems() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión para ver el carrito');
    return;
  }

  fetch(`${BASE_URL}/api/customer/cart`, {
    method: 'GET',
    headers: {
      'Authorization': token,
    },
  })
  .then(response => response.json())
  .then(cartItems => {
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = ''; // Limpiar el contenido del carrito
    if (cartItems.length === 0) {
      cartItemsDiv.innerHTML = '<p>Tu carrito está vacío</p>';
    } else {
      let totalAmount = 0;
      cartItems.forEach(item => {
        totalAmount += item.price * item.quantity;
        cartItemsDiv.innerHTML += `
          <div class="cart-item">
            <p>Producto: ${item.name}</p>
            <p>Precio: ${item.price}</p>
            <p>Cantidad: ${item.quantity}</p>
          </div>
        `;
      });
      document.getElementById('total-amount').innerText = `Total a Pagar: $${totalAmount}`;
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Función para finalizar la compra
function checkout() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión para finalizar la compra');
    return;
  }

  fetch(`${BASE_URL}/api/customer/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': token,
    },
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Compra realizada con éxito') {
      alert('Compra realizada con éxito');
      // Mostrar detalles de la factura
      const invoiceDiv = document.getElementById('invoice');
      const invoiceDetailsDiv = document.getElementById('invoice-details');
      let invoiceDetails = '';

      data.order.items.forEach(item => {
        invoiceDetails += `
          <div class="invoice-item">
            <p>Producto: ${item.name} - Cantidad: ${item.quantity} - Total: $${item.total}</p>
          </div>
        `;
      });

      invoiceDetailsDiv.innerHTML = invoiceDetails;
      document.getElementById('invoice-total').innerText = `Monto Total: $${data.order.totalAmount}`;

      // Mostrar la sección de la factura y ocultar el carrito
      document.getElementById('cart-items').style.display = 'none';
      document.getElementById('total-amount').style.display = 'none';
      document.getElementById('invoice').style.display = 'block';
    } else {
      alert(data.message);
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Cargar los productos o el carrito dependiendo de la página
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  if (role === 'customer') {
    if (window.location.pathname.includes('customer.html')) {
      loadProducts();
    } else if (window.location.pathname.includes('cart.html')) {
      loadCartItems();
    }
  }
});
