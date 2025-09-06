/**
 * File routes
 *
 * Upload flow:
 *  POST /files/upload/:folderId   -> multer middleware -> upload to Supabase -> create File record
 *
 * Download flow:
 *  GET /files/download/:fileId    -> validates owner or share token -> generates signed URL and redirects
 *
 * Delete:
 *  POST /files/:id/delete
 */

const express = require("express")
const multer = require("multer")
const path = require("path")
const router = express.Router()
const ensureAuth = require("../middleware/ensureAuth.js")
const fileController = require("../controllers/fileController")

// Multer disk storage to a temp location
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "uploads"))
  },
  filename: (req, file, cb) => {
    // keep original filename for user, but multer stores a temp filename
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, unique + "-" + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit; adjust to your needs
  },
  fileFilter: (req, file, cb) => {
    // Example allow list — adapt as needed
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Unsupported file type: " + file.mimetype))
    }
  },
})

router.post("/files/upload/:folderId", ensureAuth, upload.single("file"), fileController.uploadFile)

// Download (authenticated users must own or folder owner)
router.get("/files/download/:fileId", ensureAuth, fileController.downloadFile)

// Delete
router.post("/files/:id/delete", ensureAuth, fileController.deleteFile)

module.exports = router
