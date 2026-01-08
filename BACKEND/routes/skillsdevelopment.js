import express from "express";
import db from "../db/conn.mjs"
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

router.get("/",bruteforce.prevent, async (req,res) =>{
    let collection = await db.collection("skillsdevelopment");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});


//creating a cohort
router.post("/resources",bruteforce.prevent, async(req,res) =>{
    let newDocument ={
    id: req.body.id,
    title: req.body.title,
    description:req.body.description,
    cohort:req.body.cohort,
    startdate:req.body.startdate,
    duedate: req.body.duedate,
    status:req.body.status,
    assignedStudents:req.body.assignedStudents
   
      
    };

    let collection = await db.collection("skillsdevelopment");
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
}
);

router.patch("/:id",bruteforce.prevent, async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {
      $set: {
       cohortname: req.body.cohortname,
       cohorttrack: req.body.cohorttrack,
       cohortnumber:req.body.cohortnumber,
       programname:req.body.programname,
       startdate:req.body.startdate
      },
    };

    let collection = db.collection("skillsdevelopment");
    let result = await collection.updateOne(query, updates); 
res.send(result).status(200);
  });



  router.delete("/:id",bruteforce.prevent, async(req,res) =>{
        const query = { _id: new ObjectId(req.params.id) };

        const collection = db.collection("skillsdevelopment");
        let result = await collection.deleteOne(query);

        res.send(result).status(200);
    });

export default router;