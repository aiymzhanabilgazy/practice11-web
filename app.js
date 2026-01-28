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

let itemsCollection;

async function connectDB() {
  try{
  await client.connect();
  const db = client.db('shop');
  itemsCollection = db.collection('items');
  console.log("Connected to MongoDB");
  }catch (err){
    console.error(err);
    process.exit(1);
  } 
}
connectDB();

//routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Practice Task-13</h1>
    <ul>
      <li><a href="/api/items">GET/api/items</a></li>
      <li><a href="/api/items/:id">GET/api/items:id</a></li>
      <li><a href="/api/items">POST/api/items</a></li>
      <li><a href="/api/items/:id">PUT/api/items:id</a></li>
      <li><a href="/api/items/:id">PATCH/api/items:id</a></li>
      <li><a href="/api/items">DELETE/api/items/:id</a></li>
    </ul>
  `);
});
app.get('/api/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await itemsCollection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
});
app.post('/api/items', async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const result = await itemsCollection.insertOne({ name, price });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


app.put('/api/items/:id', async (req, res) => {
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
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

app.patch('/api/items/:id', async (req, res) => {
  try {
    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item updated partially' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const result = await itemsCollection.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID' });
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