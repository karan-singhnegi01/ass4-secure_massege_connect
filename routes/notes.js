const express = require('express');
const { load, save } = require('../store');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
router.use(authenticate);

router.get('/', (req, res) => res.json(load().notes.filter(n => n.owner === req.user.id)));
router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });
  const data = load();
  const note = { id: crypto.randomUUID(), title, content, owner: req.user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  data.notes.push(note); save(data); res.status(201).json(note);
});
router.put('/:id', (req, res) => {
  const data = load(); const note = data.notes.find(n => n.id === req.params.id && n.owner === req.user.id);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  if (req.body.title !== undefined) note.title = req.body.title;
  if (req.body.content !== undefined) note.content = req.body.content;
  note.updatedAt = new Date().toISOString(); save(data); res.json(note);
});
router.delete('/:id', (req, res) => {
  const data = load(); const index = data.notes.findIndex(n => n.id === req.params.id && n.owner === req.user.id);
  if (index === -1) return res.status(404).json({ message: 'Note not found' });
  data.notes.splice(index, 1); save(data); res.json({ message: 'Note deleted' });
});
module.exports = router;
