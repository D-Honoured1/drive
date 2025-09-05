/**
 * Folder controllers: CRUD + dashboard
 *
 * Important:
 * - All operations are parameterized via Prisma (no raw SQL).
 * - Deleting a folder triggers deletion of associated files from Supabase storage (explicit).
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
      orderBy: { updatedAt: 'desc' }
    });
    res.render('dashboard', { user, folders });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Server error');
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('Folder name required');
    await prisma.folder.create({
      data: {
        name,
        ownerId: req.user.id
      }
    });
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).send('Server error');
  }
};

exports.viewFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true, owner: true }
    });
    if (!folder) return res.status(404).send('Folder not found');
    // ensure owner
    if (folder.ownerId !== req.user.id) {
      return res.status(403).send('Forbidden');
    }
    res.render('folder', { user: req.user, folder });
  } catch (err) {
    console.error('View folder error:', err);
    res.status(500).send('Server error');
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const { name } = req.body;
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).send('Folder not found');
    if (folder.ownerId !== req.user.id) return res.status(403).send('Forbidden');

    await prisma.folder.update({
      where: { id: folderId },
      data: { name }
    });
    res.redirect('/folders/' + folderId);
  } catch (err) {
    console.error('Update folder error:', err);
    res.status(500).send('Server error');
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true }
    });
    if (!folder) return res.status(404).send('Folder not found');
    if (folder.ownerId !== req.user.id) return res.status(403).send('Forbidden');

    // Delete files from Supabase storage first
    const filePaths = folder.files.map((f) => f.storagePath);
    if (filePaths.length > 0) {
      // supabase remove expects array of paths
      const { error } = await supabaseAdmin.storage.from(BUCKET).remove(filePaths);
      if (error) {
        // log but continue to remove DB records
        console.error('Supabase remove error:', error);
      } else {
        console.log('Removed files from bucket:', filePaths);
      }
    }

    // Delete folder (cascade will remove file records via Prisma schema cascade)
    await prisma.folder.delete({ where: { id: folderId } });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).send('Server error');
  }
};
