/**
 * Share routes (public)
 *
 * POST /share/create      -> create share link (authenticated)
 * GET  /share/:token      -> public view of shared folder (no auth required)
 * GET  /share/download/:token/:fileId -> download file via share token
 */

const express = require("express")
const router = express.Router()
const ensureAuth = require("../middleware/ensureAuth.js")
const shareController = require("../controllers/shareController")

router.post("/share/create", ensureAuth, shareController.createShare)
router.get("/share/:token", shareController.viewShare)
router.get("/share/download/:token/:fileId", shareController.downloadSharedFile)

module.exports = router
