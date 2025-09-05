/**
 * File controllers
 *
 * uploadFile:
 *  - Validate folder and ownership
 *  - Upload temp file to Supabase Storage (server-side)
 *  - Create File record with storagePath (object key)
 *  - Remove local temp file
 *
 * downloadFile:
 *  - Validate ownership (owner only)
 *  - Generate signed URL (or public URL) and redirect/stream
 *
 * deleteFile:
 *  - Validate ownership
 *  - Remove from Supabase then delete DB record
 */

const prisma = require('../db/prismaClient');
const { supabaseAdmin } = require('../utils/supabaseClient');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const SIGNED_EXPIRES = parseInt(process.env.SIGNED_URL_EXPIRES || '3600', 10);

exports.uploadFile = async (req, res) => {
  const folderId = parseInt(req.params.folderId, 10);
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }

  try {
    // Validate folder exists and belongs to user
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      // remove temp
      await fsPromises.unlink(file.path).catch(() => {});
      return res.status(404).send('Folder not found');
    }
    if (folder.ownerId !== req.user.id) {
      await fsPromises.unlink(file.path).catch(() => {});
      return res.status(403).send('Forbidden to upload to this folder');
    }

    // Create a storage key: userId/folderId/uuid-originalname
    const key = `${req.user.id}/${folderId}/${uuidv4()}-${file.originalname}`;

    // Stream file to Supabase Storage
    const fileStream = fs.createReadStream(file.path);
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(key, fileStream, {
        // upsert: false to avoid overwriting
        upsert: false,
        contentType: file.mimetype
      });

    // Remove temp file regardless
    await fsPromises.unlink(file.path).catch(console.warn);

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).send('Error uploading file to storage');
    }

    // We store the storage key (path) in DB. URLs are generated on demand.
    const saved = await prisma.file.create({
      data: {
        folderId,
        ownerId: req.user.id,
        filename: path.basename(key),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: key
      }
    });

    res.redirect('/folders/' + folderId);
  } catch (err) {
    console.error('Upload error:', err);
    // try to cleanup temp file
    await fsPromises.unlink(file.path).catch(() => {});
    res.status(500).send('Server error during upload');
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const fileId = parseInt(req.params.fileId, 10);
    const file = await prisma.file.findUnique({ where: { id: fileId }, include: { folder: true } });
    if (!file) return res.status(404).send('File not found');

    // Only owner of folder/file allowed
    if (file.ownerId !== req.user.id && file.folder.ownerId !== req.user.id) {
      return res.status(403).send('Forbidden');
    }

    // Create signed URL for the storagePath
    const pathKey = file.storagePath;
    // Note: if bucket is public, you can use getPublicUrl
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(pathKey, SIGNED_EXPIRES);

    if (error) {
      console.error('Create signed URL error:', error);
      return res.status(500).send('Could not create download URL');
    }

    // Redirect to Signed URL (client downloads from Supabase)
    return res.redirect(data.signedUrl);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Server error');
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return res.status(404).send('File not found');

    // Only owner can delete
    if (file.ownerId !== req.user.id) return res.status(403).send('Forbidden');

    // Remove from bucket
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([file.storagePath]);
    if (error) {
      console.error('Supabase remove error:', error);
      // continue to delete DB record to avoid orphaned records
    }

    // Delete from DB
    await prisma.file.delete({ where: { id } });

    res.redirect('/folders/' + file.folderId);
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).send('Server error');
  }
};
