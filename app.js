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

// auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || authHeader !== 'Bearer practice-task-14') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
};

const url = process.env.MONGO_URI;
const client = new MongoClient(url);

let itemsCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db('shop');
    itemsCollection = db.collection('items');
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
connectDB();

//routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Practice Task-14</h1>
    <ul>
      <li><a href="/api/items">GET /api/items</a></li>
      <li><a href="/api/items/:id">GET /api/items/:id</a></li>
      <li>POST /api/items (protected)</li>
      <li>PUT /api/items/:id (protected)</li>
      <li>PATCH /api/items/:id (protected)</li>
      <li>DELETE /api/items/:id (protected)</li>
    </ul>
  `);
});

// GET all items
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.status(200).json(items);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET one item 
app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await itemsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(item);
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

// POST- create a new item
app.post('/api/items', authMiddleware, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await itemsCollection.insertOne({ name, price });
    res.status(201).json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT -update all fields of an item
app.put('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, price } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item updated' });
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

// PATCH -update some fields of an item
app.patch('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item updated partially' });
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

// DELETE 
app.delete('/api/items/:id', authMiddleware, async (req, res) => {
  try {
    const result = await itemsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(204).end();
  } catch {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

//404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

//start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
