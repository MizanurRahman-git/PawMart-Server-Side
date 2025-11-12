const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const admin = require("firebase-admin");
const serviceAccount = require("./tokenKey.json");
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// server connection info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@simple-crud-serv.sbd6kzc.mongodb.net/?appName=Simple-CRUD-Serv`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyUsers = async (req, res, next) => {
  const authorization = req.headers.authorization;
  
  if (!authorization) {
    res.status(401).send({
      message: "Unauthorized Access",
    });
  }
  
  const token = authorization.split(" ")[1];
  
  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).send({
      message: "Unauthorized Access",
    });
  }
};

app.get("/", (req, res) => {
  res.send("PawMart Server Runing...");
});

async function run() {
  try {
    // await client.connect()
    const db = client.db("PawMartStore");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    //product details
    app.get("/products/:id", verifyUsers, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    //All Products
    app.get("/allProducts", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // display by category
    app.get("/category/:category", async (req, res) => {
      const category = req.params.category;
      const query = {
        category: category,
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // 6 products showing on home page
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find().sort({ date: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // product Post / Add
    app.post("/products", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await productsCollection.insertOne(data);
      res.send(result);
    });

    // find product in email
    app.get("/my-listing", async (req, res) => {
      const email = req.query.email;
      const query = {
        buyerEmail: email,
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // Update Product
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateInfo = req.body;
      const update = {
        $set: updateInfo,
      };
      const result = await productsCollection.updateOne(filter, update);
      res.send(result);
    });

    // Delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // My Orders
    app.post("/myOrders", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await ordersCollection.insertOne(data);
      res.send(result);
    });

    // Display My Order list
    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const query = {
        buyerEmail: email,
      };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

    // Delete Order
    app.delete("/myOrders/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: id };
      const result = await ordersCollection.deleteOne(query);
      res.send(result);
    });

    // search option
    app.get("/search", async (req, res) => {
      const searchText = req.query.search;
      const query = { productName: { $regex: searchText, $options: "i" } };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
