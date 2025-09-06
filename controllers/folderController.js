/**
 * Folder controllers: CRUD + dashboard
 *
 * Important:
 * - All operations are parameterized via Prisma (no raw SQL).
 * - Deleting a folder triggers deletion of associated files from Supabase storage (explicit).
 * - Updated to include page-specific assets (CSS/JS) for Option 2 implementation.
 */

const prisma = require('../db/prismaClient');
const { supabaseAdmin } = require('../utils/supabaseClient');
const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const fs = require('fs').promises;
const path = require('path');

exports.dashboard = async (req, res) => {
  try {
    const user = req.user;
    const folders = await prisma.folder.findMany({
      where: { ownerId: user.id },
      include: {
        files: {
          select: { id: true } // Just for counting files
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Add file count to each folder for better UX
    const foldersWithCount = folders.map(folder => ({
      ...folder,
      fileCount: folder.files.length
    }));

    res.render('dashboard', { 
      user, 
      folders: foldersWithCount,
      pageTitle: 'Dashboard',
      pageScript: '/js/dashboard.js',
      pageCSS: '/css/dashboard.css'
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    req.flash('error', 'Error loading dashboard');
    res.render('dashboard', { 
      user: req.user, 
      folders: [],
      pageTitle: 'Dashboard',
      pageScript: '/js/dashboard.js',
      pageCSS: '/css/dashboard.css'
    });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      req.flash('error', 'Folder name is required');
      return res.redirect('/dashboard');
    }

    // Check for duplicate folder names
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: name.trim(),
        ownerId: req.user.id
      }
    });

    if (existingFolder) {
      req.flash('error', 'A folder with this name already exists');
      return res.redirect('/dashboard');
    }

    await prisma.folder.create({
      data: {
        name: name.trim(),
        ownerId: req.user.id
      }
    });

    req.flash('success', `Folder "${name.trim()}" created successfully`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Create folder error:', err);
    req.flash('error', 'Error creating folder');
    res.redirect('/dashboard');
  }
};

exports.viewFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    
    if (isNaN(folderId)) {
      req.flash('error', 'Invalid folder ID');
      return res.redirect('/dashboard');
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { 
        files: {
          orderBy: { uploadedAt: 'desc' }
        },
        owner: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!folder) {
      req.flash('error', 'Folder not found');
      return res.redirect('/dashboard');
    }

    // Ensure user owns the folder
    if (folder.ownerId !== req.user.id) {
      req.flash('error', 'You do not have permission to view this folder');
      return res.redirect('/dashboard');
    }

    // Calculate total folder size
    const totalSize = folder.files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    res.render('folder', { 
      user: req.user, 
      folder: {
        ...folder,
        totalSize,
        fileCount: folder.files.length
      },
      pageTitle: `${folder.name} - Folder`,
      pageScripts: ['/js/folder.js', '/js/file-upload.js'], // Multiple scripts for folder functionality
      pageCSS: '/css/folder.css'
    });
  } catch (err) {
    console.error('View folder error:', err);
    req.flash('error', 'Error loading folder');
    res.redirect('/dashboard');
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(folderId)) {
      req.flash('error', 'Invalid folder ID');
      return res.redirect('/dashboard');
    }

    if (!name || !name.trim()) {
      req.flash('error', 'Folder name is required');
      return res.redirect(`/folders/${folderId}`);
    }

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    
    if (!folder) {
      req.flash('error', 'Folder not found');
      return res.redirect('/dashboard');
    }

    if (folder.ownerId !== req.user.id) {
      req.flash('error', 'You do not have permission to update this folder');
      return res.redirect('/dashboard');
    }

    // Check for duplicate names (excluding current folder)
    const existingFolder = await prisma.folder.findFirst({
      where: {
        name: name.trim(),
        ownerId: req.user.id,
        id: { not: folderId }
      }
    });

    if (existingFolder) {
      req.flash('error', 'A folder with this name already exists');
      return res.redirect(`/folders/${folderId}`);
    }

    await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() }
    });

    req.flash('success', 'Folder name updated successfully');
    res.redirect('/folders/' + folderId);
  } catch (err) {
    console.error('Update folder error:', err);
    req.flash('error', 'Error updating folder');
    res.redirect(`/folders/${req.params.id}`);
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);

    if (isNaN(folderId)) {
      req.flash('error', 'Invalid folder ID');
      return res.redirect('/dashboard');
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });

    if (!folder) {
      req.flash('error', 'Folder not found');
      return res.redirect('/dashboard');
    }

    if (folder.ownerId !== req.user.id) {
      req.flash('error', 'You do not have permission to delete this folder');
      return res.redirect('/dashboard');
    }

    // Delete files from Supabase storage first
    if (folder.files.length > 0) {
      const filePaths = folder.files.map((f) => f.storagePath).filter(Boolean);
      
      if (filePaths.length > 0) {
        console.log(`Deleting ${filePaths.length} files from Supabase storage...`);
        const { error } = await supabaseAdmin.storage.from(BUCKET).remove(filePaths);
        
        if (error) {
          console.error('Supabase storage deletion error:', error);
          // Continue with database deletion even if storage fails
          req.flash('warning', 'Some files could not be deleted from storage, but folder was removed');
        } else {
          console.log('Successfully removed files from storage:', filePaths);
        }
      }
    }

    // Delete folder (cascade will remove file records via Prisma schema)
    await prisma.folder.delete({ where: { id: folderId } });

    req.flash('success', `Folder "${folder.name}" and all its files have been deleted`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Delete folder error:', err);
    req.flash('error', 'Error deleting folder');
    res.redirect('/dashboard');
  }
};