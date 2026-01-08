import express from "express";
import db from "../db/conn.mjs";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

// GET / - Basic info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "OnTrack Connect Assessments API",
    version: "1.0.0",
    endpoints: {
      "GET /": "API information",
      "GET /total": "Get total assessments count",
      "GET /totals-by-program": "Get assessment totals by program",
      "GET /totals-by-type": "Get assessment totals by type",
      "GET /tasks": "Get tasks (authenticated)",
      "GET /modules": "Get modules (authenticated)",
      "GET /assignments": "Get assignments (authenticated)",
      "GET /projects": "Get projects (authenticated)",
      "GET /resources": "Get resources (authenticated)",
      "POST /": "Create assessment (authenticated)",
      "PATCH /:id": "Update assessment (authenticated)",
      "DELETE /:id": "Delete assessment (authenticated)",
      "GET /download/:id": "Download assessment file"
    },
    timestamp: new Date().toISOString()
  });
});

/* Using shared `authenticateToken` middleware from ../middleware/auth.js */
/* ========================= HELPERS ========================= */

const typeQuery = (type, program, track) => ({
    assessmenttype: { $regex: new RegExp(`^${type}$`, "i") },
    program: { $regex: new RegExp(`^${program}$`, "i") },
    track: { $regex: new RegExp(`^${track}$`, "i") }
});

const userTypeQuery = (type, user) => ({
    assessmenttype: { $regex: new RegExp(`^${type}$`, "i") },
    $or: [
        { program: user.program },
        { track: user.track },
        { isGeneral: true }
    ]
});

/* ========================= CRUD ========================= */

router.get("/", authenticateToken, async (req, res) => {
    try {
        const { program, track } = req.query;
        const query = {};

        if (program) query.program = { $regex: new RegExp(`^${program}$`, "i") };
        if (track) query.track = { $regex: new RegExp(`^${track}$`, "i") };

        const results = await db.collection("assessments").find(query).toArray();
        res.json(results);
    } catch {
        res.status(500).json({ error: "Failed to fetch assessments" });
    }
});

router.post("/", authenticateToken, upload.single("document"), async (req, res) => {
    try {
        const doc = {
            assessmentname: req.body.assessmentname,
            assessmenttype: req.body.assessmenttype?.toLowerCase(),
            program: req.body.program,
            track: req.body.track,
            dateadded: req.body.dateadded,
            datedue: req.body.datedue,
            createdAt: new Date()
        };

        if (req.file) {
            doc.document = {
                fileName: req.file.originalname,
                storedFileName: req.file.filename,
                filePath: req.file.path,
                relativePath: `/uploads/${req.file.filename}`,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                uploadedAt: new Date()
            };
        }

        const result = await db.collection("assessments").insertOne(doc);
        res.status(201).json({ message: "Assessment created", id: result.insertedId });
    } catch {
        res.status(500).json({ error: "Failed to create assessment" });
    }
});

router.patch("/:id", authenticateToken, upload.single("document"), async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const collection = db.collection("assessments");
        const current = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!current) {
            return res.status(404).json({ error: "Assessment not found" });
        }

        // Validate required fields are not blank if they are being updated
        const requiredFields = ['assessmentname', 'assessmenttype', 'program', 'track', 'dateadded', 'datedue'];
        const validationErrors = [];

        requiredFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== null &&
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

        if (req.file && current.document?.filePath && fs.existsSync(current.document.filePath)) {
            fs.unlinkSync(current.document.filePath);
        }

        const update = {
            updatedAt: new Date()
        };

        if (req.body.assessmentname !== undefined) update.assessmentname = req.body.assessmentname.trim();
        if (req.body.assessmenttype !== undefined) update.assessmenttype = req.body.assessmenttype?.toLowerCase().trim();
        if (req.body.program !== undefined) update.program = req.body.program.trim();
        if (req.body.track !== undefined) update.track = req.body.track.trim();
        if (req.body.dateadded !== undefined) update.dateadded = req.body.dateadded.trim();
        if (req.body.datedue !== undefined) update.datedue = req.body.datedue.trim();

        if (req.file) {
            update.document = {
                fileName: req.file.originalname,
                storedFileName: req.file.filename,
                filePath: req.file.path,
                relativePath: `/uploads/${req.file.filename}`,
                mimeType: req.file.mimetype,
                fileSize: req.file.size,
                uploadedAt: new Date()
            };
        }

        await collection.updateOne({ _id: current._id }, { $set: update });
        res.json({ message: "Assessment updated" });
    } catch {
        res.status(500).json({ error: "Failed to update assessment" });
    }
});

router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const collection = db.collection("assessments");
        const assessment = await collection.findOne({ _id: new ObjectId(req.params.id) });

        if (!assessment) {
            return res.status(404).json({ error: "Assessment not found" });
        }

        if (assessment.document?.filePath && fs.existsSync(assessment.document.filePath)) {
            fs.unlinkSync(assessment.document.filePath);
        }

        await collection.deleteOne({ _id: assessment._id });
        res.json({ message: "Assessment deleted" });
    } catch {
        res.status(500).json({ error: "Failed to delete assessment" });
    }
});

/* ========================= USER QUERIES ========================= */

router.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const tasks = await db.collection("assessments")
      .find(userTypeQuery("task", req.dbUser))
      .sort({ datedue: 1 })
      .toArray();

    // Add documentLink field for frontend compatibility
    const tasksWithLinks = tasks.map(task => ({
      ...task,
      documentLink: task.document?.relativePath || null,
      name: task.assessmentname || task.title || task.name || null,
      description: task.description || task.instructions || null
    }));

    res.json(tasksWithLinks);
  } catch {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});


router.get("/modules", authenticateToken, async (req, res) => {
  try {
    const results = await db.collection("assessments")
      .find(userTypeQuery("module", req.dbUser))
      .toArray();

    // Add documentLink field for frontend compatibility
    const modulesWithLinks = results.map(module => ({
      ...module,
      documentLink: module.document?.relativePath || null,
      name: module.assessmentname || module.title || module.name || null,
      description: module.description || module.instructions || null
    }));

    res.json(modulesWithLinks);
  } catch {
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});

router.get("/assignments", authenticateToken, async (req, res) => {
  try {
    const results = await db.collection("assessments")
      .find(userTypeQuery("assignment", req.dbUser))
      .toArray();

    // Add documentLink field for frontend compatibility
    const assignmentsWithLinks = results.map(assignment => ({
      ...assignment,
      documentLink: assignment.document?.relativePath || null,
      name: assignment.assessmentname || assignment.title || assignment.name || null,
      description: assignment.description || assignment.instructions || null
    }));

    res.json(assignmentsWithLinks);
  } catch {
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});


router.get("/projects", authenticateToken, async (req, res) => {
  try {
    const results = await db.collection("assessments")
      .find(userTypeQuery("project", req.dbUser))
      .toArray();

    // Add documentLink field for frontend compatibility
    const projectsWithLinks = results.map(project => ({
      ...project,
      documentLink: project.document?.relativePath || null,
      name: project.assessmentname || project.title || project.name || null,
      description: project.description || project.instructions || null
    }));

    res.json(projectsWithLinks);
  } catch {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/resources", authenticateToken, async (req, res) => {
  try {
    const results = await db.collection("assessments")
      .find(userTypeQuery("resource", req.dbUser))
      .toArray();

    // Add documentLink field for frontend compatibility
    const resourcesWithLinks = results.map(resource => ({
      ...resource,
      documentLink: resource.document?.relativePath || null,
      name: resource.assessmentname || resource.title || resource.name || null,
      description: resource.description || resource.instructions || null
    }));

    res.json(resourcesWithLinks);
  } catch {
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});


router.get("/welcome", async (req, res) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    res.json({ message: "Welcome to the OnTrack Connect API Service!" });
});

/* ========================= DASHBOARD ENDPOINTS ========================= */

// GET total assessments count - FOR DASHBOARD - REMOVED RATE LIMITING FOR DASHBOARD
router.get("/total", async (req, res) => {
  try {
    const collection = await db.collection("assessments");
    const total = await collection.countDocuments({});

    res.status(200).json({
      total: total,
      message: "Total assessments retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching total assessments:", error);
    res.status(500).json({
      error: "Failed to fetch total assessments"
    });
  }
});

// GET assessment totals by program - FOR DASHBOARD - REMOVED RATE LIMITING FOR DASHBOARD
router.get("/totals-by-program", async (req, res) => {
  try {
    const collection = await db.collection("assessments");

    // Aggregate assessments by program
    const pipeline = [
      {
        $match: {
          program: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$program",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          program: "$_id",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();

    // Convert to object format for easier frontend consumption
    const totals = {};
    results.forEach(item => {
      totals[item.program] = item.count;
    });

    res.status(200).json({
      totals: totals,
      message: "Assessment totals by program retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching assessment totals by program:", error);
    res.status(500).json({
      error: "Failed to fetch assessment totals by program"
    });
  }
});

// GET assessment totals by type - FOR DASHBOARD - REMOVED RATE LIMITING FOR DASHBOARD
router.get("/totals-by-type", async (req, res) => {
  try {
    const collection = await db.collection("assessments");

    // Aggregate assessments by type
    const pipeline = [
      {
        $match: {
          assessmenttype: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$assessmenttype",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: "$_id",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const results = await collection.aggregate(pipeline).toArray();

    // Convert to object format for easier frontend consumption
    const totals = {};
    results.forEach(item => {
      totals[item.type] = item.count;
    });

    res.status(200).json({
      totals: totals,
      message: "Assessment totals by type retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching assessment totals by type:", error);
    res.status(500).json({
      error: "Failed to fetch assessment totals by type"
    });
  }
});

/* ========================= FILE DOWNLOAD ========================= */

router.get("/download/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        const assessment = await db.collection("assessments")
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!assessment?.document || !fs.existsSync(assessment.document.filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        res.setHeader("Content-Type", assessment.document.mimeType);
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${assessment.document.fileName}"`
        );

        fs.createReadStream(assessment.document.filePath).pipe(res);
    } catch {
        res.status(500).json({ error: "Failed to download file" });
    }
});

/* ========================= DEBUG / SEED ========================= */

router.get("/debug-database-contents", async (req, res) => {
    const docs = await db.collection("assessments").find({}).toArray();

    const byType = {};
    docs.forEach(d => {
        const t = d.assessmenttype || "unknown";
        byType[t] ??= [];
        byType[t].push({ id: d._id, name: d.assessmentname });
    });

    res.json({
        totalDocuments: docs.length,
        byType,
        programs: [...new Set(docs.map(d => d.program).filter(Boolean))],
        tracks: [...new Set(docs.map(d => d.track).filter(Boolean))]
    });
});

router.post("/create-test-task", async (req, res) => {
    const { program, track } = req.body;

    const task = {
        assessmentname: `Test Task - ${program}`,
        assessmenttype: "task",
        program,
        track,
        datedue: new Date(Date.now() + 7 * 86400000),
        createdAt: new Date()
    };

    const result = await db.collection("assessments").insertOne(task);
    res.status(201).json({ message: "Test task created", id: result.insertedId });
});

router.post("/create-sample-data", async (req, res) => {
    const { program, track } = req.body;

    const data = ["task", "module", "assignment", "project"].map(type => ({
        assessmentname: `${type.toUpperCase()} Sample`,
        assessmenttype: type,
        program,
        track,
        createdAt: new Date()
    }));

    const result = await db.collection("assessments").insertMany(data);
    res.status(201).json({ message: "Sample data created", count: result.insertedCount });
});

// DELETE all assessments - BE VERY CAREFUL WITH THIS
// DELETE all assessments - WITH DEBUG LOGGING
router.delete("/admin/delete-all", async (req, res) => {
    console.log("DELETE ALL ASSESSMENTS endpoint hit");
    
    try {
        // Add admin check - modify based on your user structure
        // If you don't have isAdmin field, you might check by email or role
        if (!req.dbUser.email?.includes("admin") && !req.dbUser.role?.includes("admin")) {
            console.log("Non-admin user attempted delete:", req.dbUser.email || req.dbUser._id);
            return res.status(403).json({ 
                error: "Admin access required",
                user: req.dbUser.email || "unknown"
            });
        }

        console.log("Admin user confirmed:", req.dbUser.email || req.dbUser._id);

        // First, find all assessments
        const assessments = await db.collection("assessments").find({}).toArray();
        console.log(`Found ${assessments.length} assessments to delete`);

        // Delete all associated files
        let filesDeleted = 0;
        let fileErrors = [];
        
        assessments.forEach(assessment => {
            try {
                if (assessment.document?.filePath && fs.existsSync(assessment.document.filePath)) {
                    fs.unlinkSync(assessment.document.filePath);
                    filesDeleted++;
                    console.log(`Deleted file: ${assessment.document.fileName}`);
                }
            } catch (fileError) {
                console.error(`Error deleting file for assessment ${assessment._id}:`, fileError);
                fileErrors.push({ assessmentId: assessment._id, error: fileError.message });
            }
        });

        // Delete all documents from collection
        console.log("Deleting from database...");
        const result = await db.collection("assessments").deleteMany({});
        console.log(`Database delete result: ${result.deletedCount} documents deleted`);
        
        res.json({ 
            message: `Successfully deleted ${result.deletedCount} assessments`,
            deletedCount: result.deletedCount,
            filesDeleted: filesDeleted,
            fileErrors: fileErrors.length > 0 ? fileErrors : undefined,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("ERROR in delete-all route:", error);
        console.error("Error stack:", error.stack);
        console.error("Request user:", req.dbUser);
        
        res.status(500).json({ 
            error: "Failed to delete all assessments",
            detailedError: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add this before your delete route to debug
router.get("/check-auth", authenticateToken, (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user,
        dbUser: req.dbUser,
        hasDbUser: !!req.dbUser,
        dbUserKeys: req.dbUser ? Object.keys(req.dbUser) : 'none'
    });
});
export default router;
