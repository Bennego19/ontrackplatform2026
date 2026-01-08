import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
const router = express.Router();
var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

// GET / - Basic info endpoint
router.get("/", (req, res) => {
  res.json({
    message: "OnTrack Connect Mentor Dashboard API",
    version: "1.0.0",
    endpoints: {
      "GET /assigned-students": "Get students assigned to mentor",
      "GET /tasks": "Get tasks created by mentor",
      "GET /assignments": "Get assignments created by mentor",
      "GET /projects": "Get projects created by mentor",
      "GET /resources": "Get resources uploaded by mentor",
      "GET /": "API information"
    },
    timestamp: new Date().toISOString()
  });
});
// Get assigned students for the authenticated mentor
router.get("/assigned-students", bruteforce.prevent, async (req, res) => {
    try {
        const mentorId = req.user.id; // Assuming authenticateToken sets req.user

        // Query the student_mentor_assignments collection to find students assigned to this mentor
        const assignmentsCollection = await db.collection("student_mentor_assignments");
        const assignments = await assignmentsCollection.find({
            mentorId: new ObjectId(mentorId),
            status: "active"
        }).toArray();

        if (assignments.length === 0) {
            return res.status(200).json([]);
        }

        // Get student details for each assignment
        const studentsCollection = await db.collection("students");
        const students = await Promise.all(
            assignments.map(async (assignment) => {
                const student = await studentsCollection.findOne({
                    _id: assignment.studentId
                });

                if (!student) {
                    return null; // Skip if student not found
                }

                return {
                    id: student._id.toString(),
                    name: `${student.name || ''} ${student.surname || ''}`.trim() || 'Unknown Student',
                    email: student.email || "",
                    program: student.program || student.cohort || "Not specified",
                    track: student.track || "Not specified",
                    progress: Math.floor(Math.random() * 100), // You might want to calculate this based on actual progress
                    status: "active",
                    studentId: student._id.toString()
                };
            })
        );

        // Filter out null values (students not found)
        const validStudents = students.filter(student => student !== null);

        res.status(200).json(validStudents);

    } catch (error) {
        console.error("Error fetching assigned students:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get tasks created by the authenticated mentor
router.get("/tasks", bruteforce.prevent, async (req, res) => {
    try {
        const mentorId = req.user.id;

        const tasksCollection = await db.collection("tasks");
        const tasks = await tasksCollection.find({ mentorId: mentorId }).toArray();

        res.status(200).json(tasks);

    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get assignments created by the authenticated mentor
router.get("/assignments", bruteforce.prevent, async (req, res) => {
    try {
        const mentorId = req.user.id;

        const assignmentsCollection = await db.collection("assignments");
        const assignments = await assignmentsCollection.find({ mentorId: mentorId }).toArray();

        res.status(200).json(assignments);

    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get projects created by the authenticated mentor
router.get("/projects", bruteforce.prevent,async (req, res) => {
    try {
        const mentorId = req.user.id;

        const projectsCollection = await db.collection("projects");
        const projects = await projectsCollection.find({ mentorId: mentorId }).toArray();

        res.status(200).json(projects);

    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ message: error.message });
    }
});

// Get resources uploaded by the authenticated mentor
router.get("/resources",bruteforce.prevent,  async (req, res) => {
    try {
        const mentorId = req.user.id;

        const resourcesCollection = await db.collection("resources");
        const resources = await resourcesCollection.find({ mentorId: mentorId }).toArray();

        res.status(200).json(resources);

    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
