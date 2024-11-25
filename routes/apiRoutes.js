
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

// Ruta para que el administrador vea los productos
router.get('/admin/products', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

    const products = readData(productsFile);
    res.status(200).json(products);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
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
const PDFDocument = require('pdfkit');
const path = require('path');

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

    let totalAmount = 0;
    const orderItems = user.cart.map(cartItem => {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) throw new Error('Producto no encontrado');

      // Validar si hay suficiente stock
      if (product.quantity < cartItem.quantity) {
        throw new Error(`Stock insuficiente para el producto: ${product.name}`);
      }

      // Reducir la cantidad del producto en el inventario
      product.quantity -= cartItem.quantity;

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

    // Agregar al historial del cliente
    user.orders.push(order);

    // Vaciar el carrito
    user.cart = [];

    // Guardar los cambios en el archivo JSON
    writeData(usersFile, users);
    writeData(productsFile, products);

    // Crear PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(__dirname, `../invoices/Factura_${order.orderId}.pdf`);
    doc.pipe(fs.createWriteStream(pdfPath));

    doc.fontSize(18).text('Factura de Compra', { align: 'center' });
    doc.fontSize(12).text(`Orden ID: ${order.orderId}`);
    doc.text(`Fecha: ${order.date}`);
    doc.text(`Total: $${order.totalAmount}`);

    doc.moveDown();
    doc.text('Productos:', { underline: true });
    order.items.forEach(item => {
      doc.text(`Producto: ${item.name} - Cantidad: ${item.quantity} - Total: $${item.total}`);
    });

    doc.end();

    res.status(200).json({ message: 'Compra realizada con éxito', order, pdfPath });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Ruta para obtener el historial de compras del cliente
router.get('/customer/history', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'customer') return res.status(403).json({ message: 'No autorizado' });

    let users = readData(usersFile);
    let user = users.find(u => u.username === decoded.username);

    res.status(200).json(user.orders);
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});

// Ruta para editar un producto existente
router.put('/admin/products/:id', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'Se requiere token de autenticación' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'No autorizado' });

    const { id } = req.params;
    const { name, description, price, quantity } = req.body;

    let products = readData(productsFile);
    const productIndex = products.findIndex(p => p.id === parseInt(id));

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    products[productIndex] = {
      ...products[productIndex],
      name,
      description,
      price,
      quantity,
    };

    writeData(productsFile, products);
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
});


module.exports = router;
