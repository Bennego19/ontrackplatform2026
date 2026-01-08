import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get all help requests (authenticated users only)
router.get("/", async (req, res) => {
  try {
    const helpRequests = await db.collection("help_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const normalized = helpRequests.map(hr => ({
      id: hr._id,
      topic: hr.topic,
      area: hr.area,
      description: hr.description,
      availability: hr.availability,
      contactPreference: hr.contactPreference,
      status: hr.status,
      helpfulCount: hr.helpfulCount || 0,
      createdBy: hr.createdBy,
      createdAt: hr.createdAt,
      updatedAt: hr.updatedAt
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Failed to fetch help requests:", err);
    res.status(500).json({ error: "Failed to fetch help requests" });
  }
});

// Get single help request
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid ID" });
    const hr = await db.collection("help_requests").findOne({ _id: new ObjectId(req.params.id) });
    if (!hr) return res.status(404).json({ error: "Help request not found" });

    res.json({
      id: hr._id,
      topic: hr.topic,
      area: hr.area,
      description: hr.description,
      availability: hr.availability,
      contactPreference: hr.contactPreference,
      status: hr.status,
      helpfulCount: hr.helpfulCount || 0,
      createdBy: hr.createdBy,
      createdAt: hr.createdAt,
      updatedAt: hr.updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch help request" });
  }
});

// Create help request (authenticated)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { topic, area, description, availability, contactPreference } = req.body;

    if (!topic || !area || !description) {
      return res.status(400).json({ error: "Topic, area, and description are required" });
    }

    const doc = {
      topic,
      area,
      description,
      availability: availability || "Flexible",
      contactPreference: contactPreference || "Email",
      status: "open",
      helpfulCount: 0,
      createdBy: {
        username: req.dbUser.username,
        name: req.dbUser.name || req.dbUser.username,
        email: req.dbUser.email
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("help_requests").insertOne(doc);
    res.status(201).json({
      message: "Help request created",
      id: result.insertedId,
      helpRequest: {
        id: result.insertedId,
        ...doc
      }
    });
  } catch (err) {
    console.error("Failed to create help request:", err);
    res.status(500).json({ error: "Failed to create help request" });
  }
});

// Update help request (authenticated - only creator can update status, anyone can mark as helpful)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(req.params.id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    const { status, markHelpful } = req.body;
    const update = { updatedAt: new Date() };

    // Only the creator can change status
    if (status && helpRequest.createdBy.username === req.dbUser.username) {
      if (!["open", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'open', 'resolved', or 'closed'" });
      }
      update.status = status;
    }

    // Anyone can mark as helpful (increment counter)
    if (markHelpful === true) {
      update.helpfulCount = (helpRequest.helpfulCount || 0) + 1;
    }

    const result = await db.collection("help_requests").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Help request not found" });

    res.json({ message: "Help request updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update help request" });
  }
});

// Delete help request (authenticated - only creator can delete)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(req.params.id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    // Only creator can delete their own request
    if (helpRequest.createdBy.username !== req.dbUser.username) {
      return res.status(403).json({ error: "You can only delete your own help requests" });
    }

    const result = await db.collection("help_requests").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Help request not found" });
    res.json({ message: "Help request deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete help request" });
  }
});

// Admin endpoint to get all help requests for admin review
router.get("/admin", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you may need to adjust this based on your user model)
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const helpRequests = await db.collection("help_requests")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const normalized = helpRequests.map(hr => ({
      id: hr._id,
      topic: hr.topic,
      area: hr.area,
      description: hr.description,
      availability: hr.availability,
      contactPreference: hr.contactPreference,
      status: hr.status,
      helpfulCount: hr.helpfulCount || 0,
      createdBy: hr.createdBy,
      createdAt: hr.createdAt,
      updatedAt: hr.updatedAt
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Failed to fetch help requests for admin:", err);
    res.status(500).json({ error: "Failed to fetch help requests" });
  }
});

// Admin endpoint to approve/reject help requests
router.put("/admin/:id", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(req.params.id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    const { status, adminNote } = req.body;
    const update = { updatedAt: new Date() };

    if (status) {
      if (!["open", "approved", "rejected", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'open', 'approved', 'rejected', 'resolved', or 'closed'" });
      }
      update.status = status;
    }

    if (adminNote) {
      update.adminNote = adminNote;
    }

    const result = await db.collection("help_requests").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Help request not found" });

    res.json({ message: "Help request updated by admin" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update help request" });
  }
});

// Specific admin endpoints for dashboard actions
router.put("/approve", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    const result = await db.collection("help_requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "approved", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Help request not found" });

    res.json({ message: "Help request approved" });
  } catch (err) {
    console.error("Error approving help request:", err);
    res.status(500).json({ error: "Failed to approve help request" });
  }
});

router.put("/reject", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    const result = await db.collection("help_requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "rejected", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Help request not found" });

    res.json({ message: "Help request rejected" });
  } catch (err) {
    console.error("Error rejecting help request:", err);
    res.status(500).json({ error: "Failed to reject help request" });
  }
});

router.put("/resolve", authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

    const helpRequest = await db.collection("help_requests").findOne({ _id: new ObjectId(id) });
    if (!helpRequest) return res.status(404).json({ error: "Help request not found" });

    const result = await db.collection("help_requests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "resolved", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Help request not found" });

    res.json({ message: "Help request resolved" });
  } catch (err) {
    console.error("Error resolving help request:", err);
    res.status(500).json({ error: "Failed to resolve help request" });
  }
});

export default router;
