import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import db from "../db/conn.mjs";

import { ObjectId } from "mongodb";
const router = express.Router();

router.use((req,res,next) =>{
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");
    next();
});

// Brute force protection
const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store);

// GET all users
router.get("/",bruteforce.prevent, async (req, res) => {
    let collection = await db.collection("users");
    let results = await collection.find({}).toArray();
    res.status(200).send(results);
});

// User signup
router.post("/signup",bruteforce.prevent, async (req, res) => {
    // Store plain text password (since login compares plain text)
    let newDocument = {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        cellnumber: req.body.cellnumber,
        course: req.body.course,
        program: req.body.program,
        track: req.body.track,
        username: req.body.username,
        password: req.body.password.trim() // store plain text password
    };

    let collection = await db.collection("users");
    let result = await collection.insertOne(newDocument);

    res.status(201).send({ message: "User created", result });
});

// Export the router
export default router;
