// Archivo: /routes/apiRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const router = express.Router();

const SECRET_KEY = 'mi_secreta_llave';
const usersFile = './data/users.json';
const productsFile = './data/products.json';

// Función para leer datos de un archivo JSON
const readData = (filePath) => {
  return JSON.parse(fs.readFileSync(filePath));
};

// Función para escribir datos en un archivo JSON
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Ruta para el administrador: Iniciar sesión
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData(usersFile);
  const admin = users.find(user => user.username === username && user.password === password && user.role === 'admin');

  if (admin) {
    const token = jwt.sign({ username: admin.username, role: admin.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

// Ruta para clientes: Registrarse
router.post('/customer/signup', (req, res) => {
  const { username, password } = req.body;
  let users = readData(usersFile);

  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  const newUser = { username, password, role: 'customer', cart: [], orders: [] };
  users.push(newUser);
  writeData(usersFile, users);

  res.status(201).json({ message: 'Registro exitoso' });
});

// Ruta para agregar productos por el administrador
router.post('/admin/products', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

    const { name, description, price, quantity } = req.body;
    let products = readData(productsFile);

    const newProduct = { id: products.length + 1, name, description, price, quantity };
    products.push(newProduct);
    writeData(productsFile, products);

    res.status(201).json({ message: 'Producto agregado exitosamente' });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Ruta para que los clientes vean los productos
router.get('/customer/products', (req, res) => {
  const products = readData(productsFile);
  res.json(products);
});

// Ruta para agregar productos al carrito del cliente
router.post('/customer/cart', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'customer') return res.status(403).json({ message: 'No autorizado' });

    const { productId, quantity } = req.body;
    let users = readData(usersFile);
    let products = readData(productsFile);
    let user = users.find(u => u.username === decoded.username);

    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

    const cartItem = user.cart.find(item => item.productId === productId);
    if (cartItem) {
      // Si el producto ya está en el carrito, aumentar la cantidad
      cartItem.quantity += quantity;
    } else {
      // Si no está, agregar un nuevo ítem
      user.cart.push({ productId, quantity });
    }

    writeData(usersFile, users);

    res.status(200).json({ message: 'Producto agregado al carrito' });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Ruta para obtener los productos del carrito del cliente
router.get('/customer/cart', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'customer') return res.status(403).json({ message: 'No autorizado' });

    let users = readData(usersFile);
    let products = readData(productsFile);
    let user = users.find(u => u.username === decoded.username);

    // Mapear los productos del carrito con detalles completos del producto
    const cartItems = user.cart.map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      return {
        productId: cartItem.productId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity
      };
    });

    res.status(200).json(cartItems);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Ruta para realizar una compra y generar una factura
router.post('/customer/checkout', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'customer') return res.status(403).json({ message: 'No autorizado' });

    let users = readData(usersFile);
    let products = readData(productsFile);
    let user = users.find(u => u.username === decoded.username);

    if (user.cart.length === 0) return res.status(400).json({ message: 'El carrito está vacío' });

    // Generar la factura
    let totalAmount = 0;
    const orderItems = user.cart.map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      const itemTotal = product.price * cartItem.quantity;
      totalAmount += itemTotal;
      return {
        productId: cartItem.productId,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        total: itemTotal
      };
    });

    const order = {
      orderId: user.orders.length + 1,
      items: orderItems,
      totalAmount,
      date: new Date().toISOString()
    };

    // Agregar la orden al historial de pedidos del usuario
    user.orders.push(order);
    // Vaciar el carrito
    user.cart = [];
    writeData(usersFile, users);

    res.status(200).json({ message: 'Compra realizada con éxito', order });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

module.exports = router;
