require('dotenv').config();

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const PORT = process.env.PORT || 3000;

//middlewares
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

let productsCollection;

async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db('shop');
  productsCollection = db.collection('products');
}

connectDB();

//routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Practice Task 10</h1>
    <ul>
      <li><a href="/api/products">/api/products</a></li>
      <li><a href="api/products?category=Electronics">/api/products?category=Electronics</a></li>
      <li><a href="api/products?minPrice=50&sort=price">/api/products?minPrice=50&sort=price</a></li>
      <li><a href="api/products?fields=name,price">/api/products?fields=name,price</a></li>
    </ul>
  `);
});

app.get('/api/products', async (req, res) => {
  const {category, minPrice, sort, fields} = req.query;
  const filter = {};

  if(category) {
    filter.category = category;
  }
  if(minPrice){
    filter.price = { $gte: Number(minPrice) };
  }
  let projection = {};
  if (fields) {
  fields.split(',').forEach(field => {
    projection[field] = 1;
  });
  projection._id = 0;
}
else if(category){
  projection = {
    name:1,
    category:1
  };
}
  let sortOption = {};
  if (sort === 'price') {
    sortOption.price = 1; 
  }
  const products = await productsCollection
    .find(filter)
    .project(projection)
    .sort(sortOption)
    .toArray();

  res.json({
    count: products.length,
    products
  });
});

//404 handler
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
//start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});