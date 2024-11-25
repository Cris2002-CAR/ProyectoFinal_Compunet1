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

// Función para ir a la página del historial de compras
function goToPurchaseHistory() {
  window.location.href = 'history.html';
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

// Función para cargar el historial de compras
function loadPurchaseHistory() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión para ver el historial de compras');
    return;
  }

  fetch(`${BASE_URL}/api/customer/history`, {
    method: 'GET',
    headers: {
      'Authorization': token,
    },
  })
  .then(response => response.json())
  .then(history => {
    const historyDiv = document.getElementById('purchase-history');
    historyDiv.innerHTML = ''; // Limpiar el historial de compras
    if (history.length === 0) {
      historyDiv.innerHTML = '<p>No tienes compras anteriores</p>';
    } else {
      history.forEach(order => {
        let orderDetails = `
          <div class="order">
            <h3>Orden ID: ${order.orderId}</h3>
            <p>Fecha: ${order.date}</p>
            <p>Total: $${order.totalAmount}</p>
            <div class="order-items">
        `;
        order.items.forEach(item => {
          orderDetails += `
            <div class="order-item">
              <p>Producto: ${item.name}</p>
              <p>Cantidad: ${item.quantity}</p>
              <p>Total: $${item.total}</p>
            </div>
          `;
        });
        orderDetails += '</div></div>';
        historyDiv.innerHTML += orderDetails;
      });
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Cargar los productos o el carrito dependiendo de la página
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('role');
  const pathname = window.location.pathname;

  // Cargar contenido según el rol y la página actual
  if (role === 'customer' && pathname.includes('customer.html')) {
    loadProducts();
  } else if (role === 'customer' && pathname.includes('cart.html')) {
    loadCartItems();
  } else if (role === 'customer' && pathname.includes('history.html')) {
    loadPurchaseHistory();
  } else if (role === 'admin' && pathname.includes('admin.html')) {
    loadAdminProducts();
  }
});

function addProduct() {
  const token = localStorage.getItem('token'); // Asegúrate de obtener el token directamente
  if (!token) {
    alert('Por favor inicia sesión como administrador para agregar productos');
    return;
  }

  const name = document.getElementById('product-name').value.trim();
  const description = document.getElementById('product-description').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const quantity = parseInt(document.getElementById('product-quantity').value);

  // Validación de los datos
  if (!name || !description || isNaN(price) || isNaN(quantity) || price <= 0 || quantity < 0) {
    alert('Por favor completa todos los campos correctamente.');
    console.log({ name, description, price, quantity }); // Log para depurar
    return;
  }

  // Enviar la solicitud al backend
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
      console.log(data); // Log para verificar la respuesta del servidor
      if (data.message) {
        alert('Producto agregado exitosamente');
        loadAdminProducts(); // Recargar la lista de productos después de agregar
      } else {
        alert('Error al agregar el producto: ' + (data.message || 'Error desconocido'));
      }
    })
    .catch(error => {
      console.error('Error al agregar producto:', error);
    });
}


// Función para cargar los productos existentes para el administrador
function loadAdminProducts() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión como administrador para gestionar productos');
    return;
  }

  fetch(`${BASE_URL}/api/admin/products`, {
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
          <div>
            <input type="text" id="name-${product.id}" value="${product.name}" placeholder="Nombre">
            <input type="text" id="description-${product.id}" value="${product.description}" placeholder="Descripción">
            <input type="number" id="price-${product.id}" value="${product.price}" placeholder="Precio">
            <input type="number" id="quantity-${product.id}" value="${product.quantity}" placeholder="Cantidad">
            <button onclick="updateProduct(${product.id})">Guardar Cambios</button>
          </div>
        `;
        productList.appendChild(productDiv);
      });
    })
    .catch(error => {
      console.error('Error al cargar productos:', error);
    });
}




// Función para editar un producto existente
function updateProduct(productId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Por favor inicia sesión como administrador para editar productos');
    return;
  }

  const name = document.getElementById(`name-${productId}`).value;
  const description = document.getElementById(`description-${productId}`).value;
  const price = parseFloat(document.getElementById(`price-${productId}`).value);
  const quantity = parseInt(document.getElementById(`quantity-${productId}`).value);

  if (!name || !description || isNaN(price) || isNaN(quantity)) {
    alert('Por favor completa todos los campos correctamente.');
    return;
  }

  fetch(`${BASE_URL}/api/admin/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ name, description, price, quantity }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        loadAdminProducts(); // Recargar los productos después de la actualización
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


// Función para cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  alert('Sesión cerrada correctamente');
  window.location.href = 'index.html';
}

