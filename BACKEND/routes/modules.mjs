import express from "express";
import db from "../db/conn.mjs"

const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";

router.get("/", async (req,res) =>{
    let collection = await db.collection("modules");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});


//user signup method
router.post("/signup", bruteforce.prevent,async(req,res) =>{
    let newDocument ={
   firstname: req.body.firstname,
   lastname: req.body.lastname,
   email: req.body.email,
   cellnumber: req.body.cellnumber,
   cohort: req.body.cohort,
   track:req.body.track,
   username: req.body.username,
   password: req.body.password
    };

    let collection = await db.collection("modules");
    let result = await collection.insertOne(newDocument);
  
    res.send(result).status(204);
}
);

router.patch("/:id", bruteforce.prevent,async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
       firstname: req.body.firstname,
   lastname: req.body.lastname,
   email: req.body.email,
   cellnumber: req.body.cellnumber,
   cohort: req.body.cohort,
   track:req.body.track,
   username: req.body.username,
   password: req.body.password
      },
    };

    let collection = db.collection("modules");
    let result = await collection.updateOne(query, updates); 
res.send(result).status(200);
  });



  router.delete("/:id",bruteforce.prevent, async(req,res) =>{
        const query = { _id: new ObjectId(req.params.id) };

        const collection = db.collection("modules");
        let result = await collection.deleteOne(query);

        res.send(result).status(200);
    });
export default router;