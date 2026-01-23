import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    const JWT_SECRET = "ontrack-connect-jwt-secret-key-2024";

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if decoded has the expected structure
        if (!decoded.id) {
            return res.status(403).json({ message: "Invalid token structure" });
        }

        // Try to find user in both collections
        let user = null;
        const userId = new ObjectId(decoded.id);

        user = await db.collection("onboardstudents").findOne({ _id: userId });

        if (!user) {
            user = await db.collection("onboardmentors").findOne({ _id: userId });
        }

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                decodedId: decoded.id
            });
        }

        // Log the user for debugging
        console.log("Auth successful for user:", {
            id: user._id,
            email: user.email,
            type: user.collection || 'unknown'
        });

        // Make sure user object has required properties
        if (!user.accessAllowed) {
            user.accessAllowed = "granted"; // default if not set
        }

        req.user = decoded;
        req.dbUser = user; // This should now be properly set

        next();
    } catch (error) {
        console.error("Authentication error:", error.message);

        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({ message: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(403).json({ message: "Token expired" });
        }

        res.status(500).json({
            message: "Authentication failed",
            error: error.message
        });
    }
};

const router = express.Router();
router.use((req,res,next) =>{
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");
    next();
});

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);


// Get user-specific assignments based on program and track
router.get("/my-assignments",bruteforce.prevent, async (req, res) => {
  try {
    const userProgram = req.user.program;
    const userTrack = req.user.track;

    const assignmentsCollection = await db.collection("assessments");

    const assignments = await assignmentsCollection.find({
      $or: [
        { program: userProgram },
        { track: userTrack },
        { isGeneral: true }
      ]
    }).toArray();

    res.json(assignments);
  } catch (error) {
    console.error("Error fetching user assignments:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// GET all assignments with optional filtering
router.get("/",bruteforce.prevent, async (req, res) => {
    try {
        let collection = await db.collection("assessments");
        let query = {};

        if (req.query.program) {
            query.program = req.query.program;
        }
        if (req.query.track) {
            query.track = req.query.track;
        }

        let results = await collection.find(query).toArray();
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

// POST create new assignment
router.post("/", authenticateToken, bruteforce.prevent, async (req, res) => {
    try {
        // Validate required fields are not blank
        const requiredFields = ['assignmentname', 'assignmenttype', 'dateadded', 'datedue', 'track', 'program'];
        const validationErrors = [];

        requiredFields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null ||
                (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
                validationErrors.push(`${field} cannot be blank`);
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors
            });
        }

        let newDocument = {
            assignmentname: req.body.assignmentname.trim(),
            assignmenttype: req.body.assignmenttype.trim(),
            dateadded: req.body.dateadded.trim(),
            datedue: req.body.datedue.trim(),
            track: req.body.track.trim(),
            program: req.body.program.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            createdAt: new Date()
        };

        let collection = await db.collection("assessments");
        let result = await collection.insertOne(newDocument);

        res.status(201).json({
            message: "Assignment created successfully",
            id: result.insertedId,
            document: newDocument
        });
    } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ error: "Failed to create assignment" });
    }
});

// PUT update assignment
router.put("/:id", authenticateToken, bruteforce.prevent, async (req, res) => {
    try {
        const id = req.params.id;

        // Validate required fields are not blank
        const requiredFields = ['assignmentname', 'assignmenttype', 'dateadded', 'datedue', 'track', 'program'];
        const validationErrors = [];

        requiredFields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null ||
                (typeof req.body[field] === 'string' && req.body[field].trim() === '')) {
                validationErrors.push(`${field} cannot be blank`);
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors
            });
        }

        let updateDocument = {
            assignmentname: req.body.assignmentname.trim(),
            assignmenttype: req.body.assignmenttype.trim(),
            dateadded: req.body.dateadded.trim(),
            datedue: req.body.datedue.trim(),
            track: req.body.track.trim(),
            program: req.body.program.trim(),
            description: req.body.description ? req.body.description.trim() : '',
            updatedAt: new Date()
        };

        let collection = await db.collection("assessments");
        let result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateDocument }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.status(200).json({
            message: "Assignment updated successfully",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update assignment" });
    }
});

// DELETE assignment
router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        let collection = await db.collection("assessments");

        let result = await collection.deleteOne({ _id: new ObjectId(id) });

        res.status(200).json({
            message: "Assignment deleted successfully",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Failed to delete assignment" });
    }
});

// GET total assignments count
router.get("/total",bruteforce.prevent, async (req, res) => {
    try {
        let collection = await db.collection("assessments");
        let total = await collection.countDocuments();
        res.status(200).json({ total });
    } catch (error) {
        console.error("Error fetching total assignments:", error);
        res.status(500).json({ error: "Failed to fetch total assignments" });
    }
});

export default router;
