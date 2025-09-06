/**
 * Folder routes - require authentication
 *
 *  GET /dashboard            -> list user's folders
 *  POST /folders             -> create folder
 *  GET /folders/:id          -> view folder (list files)
 *  POST /folders/:id/update  -> update folder name
 *  POST /folders/:id/delete  -> delete folder (and its files)
 */

const express = require("express")
const router = express.Router()
const ensureAuth = require("../middleware/ensureAuth.js")
const folderController = require("../controllers/folderController")

router.get("/dashboard", ensureAuth, folderController.dashboard)

// create folder
router.post("/folders", ensureAuth, folderController.createFolder)

// view folder
router.get("/folders/:id", ensureAuth, folderController.viewFolder)

// update folder
router.post("/folders/:id/update", ensureAuth, folderController.updateFolder)

// delete folder
router.post("/folders/:id/delete", ensureAuth, folderController.deleteFolder)

module.exports = router
