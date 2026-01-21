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
    <h1>Practice Task-11</h1>
    <ul>
      <li><a href="/api/products">/api/products</a></li>
      <li><a href="/api/products/:id">/api/products:id</a></li>
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


app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await productsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Name and price are required" });
  }

  const result = await productsCollection.insertOne({
    name,
    price,
    category
  });

  res.status(201).json({
    message: "Product created",
    id: result.insertedId
  });
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated" });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await productsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(400).json({ error: "Invalid ID" });
  }
});


//404 handler
app.use((req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
//start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});