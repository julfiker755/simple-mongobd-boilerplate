require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*", 
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Database connection
const uri = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@cluster0.3ksqccu.mongodb.net/HotelDB?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully");
    const db = client.db("HotelDB");
    const usersCollection = db.collection("users");
    return { usersCollection };
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}

async function startServer() {
  const { usersCollection } = await connectDB();

  // Get all users
  app.get("/users", async (req, res) => {
    try {
      const users = await usersCollection.find({}).toArray();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single user
  app.get("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create user
  app.post("/users", async (req, res) => {
    try {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update user
  app.put("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = req.body;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedUser }
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete user
  app.delete("/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Root route
  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  // Start listening
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();
