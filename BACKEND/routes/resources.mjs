import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);
// GET all resources
router.get("/", async (req, res) => {
  try {
    const collection = await db.collection("resources");
    const results = await collection.find({}).toArray();
    res.status(200).send(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Create a new resource
router.post("/", async (req, res) => {
  try {
    const newDocument = {
      name: req.body.name,
      description: req.body.description,
      websiteLink: req.body.websiteLink,
      program: req.body.program,
      track: req.body.track,
    };

    const collection = await db.collection("resources");
    const result = await collection.insertOne(newDocument);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create resource" });
  }
});

// Update resource
router.patch("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
        name: req.body.name,
        description: req.body.description,
        websiteLink: req.body.websiteLink,
        program: req.body.program,
        track: req.body.track,
      },
    };

    const collection = await db.collection("resources");
    const result = await collection.updateOne(query, updates);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to update resource" });
  }
});

// Delete resource
router.delete("/:id", async (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    const collection = await db.collection("resources");
    const result = await collection.deleteOne(query);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
