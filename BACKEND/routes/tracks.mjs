// routes/tracks.mjs
import express from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
const router = express.Router();
var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);
// GET /api/tracks - Get all available tracks
router.get("/",bruteforce.prevent, async (req, res) => {
  try {
    // Return predefined tracks as they are static
    const tracks = [
      { _id: "1", name: "Web Development" },
      { _id: "2", name: "Java Programming" },
      { _id: "3", name: "C# Programming" },
      { _id: "4", name: "Python Programming" },
      { _id: "5", name: "Robotics" }
    ];

    res.status(200).json(tracks);
  } catch (error) {
    console.error("Error fetching tracks:", error);
    res.status(500).json({
      error: "Failed to fetch tracks"
    });
  }
});

export default router;
