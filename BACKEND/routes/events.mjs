import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
const router = express.Router();
router.use((req,res,next) =>{
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");
    next();
});
var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);


// GET all events
router.get("/",bruteforce.prevent, async (req, res) => {
  try {
    let collection = await db.collection("events");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Create a new event
router.post("/",bruteforce.prevent, async (req, res) => {
  try {
    let newDocument = {
      name: req.body.name,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      link: req.body.link,
      createdAt: new Date()
    };

    let collection = await db.collection("events");
    let result = await collection.insertOne(newDocument);
    res.send(result).status(201);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

// Update event
router.patch("/:id",bruteforce.prevent, async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
        name: req.body.name,
        description: req.body.description,
        date: req.body.date,
        type: req.body.type,
        link: req.body.link
      },
    };

    let collection = await db.collection("events");
    let result = await collection.updateOne(query, updates);
    res.send(result).status(200);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event
router.delete("/:id",bruteforce.prevent, async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("events");
    let result = await collection.deleteOne(query);
    res.send(result).status(200);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export default router;
