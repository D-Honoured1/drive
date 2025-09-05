/**
 * Share controllers
 *
 * createShare:
 *  - Authenticated user creates a share token for a folder and duration (days)
 *
 * viewShare:
 *  - Public route: check token validity, list files with signed URLs
 *
 * downloadSharedFile:
 *  - Public route to download a specific file if token valid; returns signed URL redirect
 */

const prisma = require('../db/prismaClient');
const { supabaseAdmin } = require('../utils/supabaseClient');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const SIGNED_EXPIRES = parseInt(process.env.SIGNED_URL_EXPIRES || '3600', 10);

exports.createShare = async (req, res) => {
  try {
    const { folderId, days } = req.body;
    const folder = await prisma.folder.findUnique({ where: { id: parseInt(folderId, 10) } });
    if (!folder) return res.status(404).send('Folder not found');
    if (folder.ownerId !== req.user.id) return res.status(403).send('Forbidden');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (parseInt(days || '1', 10) * 24 * 60 * 60 * 1000));

    const link = await prisma.shareLink.create({
      data: {
        folderId: folder.id,
        token,
        expiresAt
      }
    });

    res.redirect('/share/' + token);
  } catch (err) {
    console.error('Create share error:', err);
    res.status(500).send('Server error');
  }
};

exports.viewShare = async (req, res) => {
  try {
    const { token } = req.params;
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { folder: { include: { files: true } } }
    });
    if (!link) return res.status(404).send('Share link not found');
    if (new Date() > link.expiresAt) return res.status(410).send('Share link expired');

    // For each file, generate a signed URL
    const filesWithUrls = await Promise.all(
      link.folder.files.map(async (f) => {
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(f.storagePath, SIGNED_EXPIRES);
        return {
          ...f,
          url: error ? null : data.signedUrl
        };
      })
    );

    res.render('share', { folder: link.folder, files: filesWithUrls, token });
  } catch (err) {
    console.error('View share error:', err);
    res.status(500).send('Server error');
  }
};

exports.downloadSharedFile = async (req, res) => {
  try {
    const { token, fileId } = req.params;
    const link = await prisma.shareLink.findUnique({
      where: { token },
      include: { folder: { include: { files: true } } }
    });
    if (!link) return res.status(404).send('Share link not found');
    if (new Date() > link.expiresAt) return res.status(410).send('Share link expired');

    const file = link.folder.files.find((f) => f.id === parseInt(fileId, 10));
    if (!file) return res.status(404).send('File not in shared folder');

    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(file.storagePath, SIGNED_EXPIRES);
    if (error) {
      console.error('Signed URL error:', error);
      return res.status(500).send('Could not generate download link');
    }
    return res.redirect(data.signedUrl);
  } catch (err) {
    console.error('Download shared file error:', err);
    res.status(500).send('Server error');
  }
};
