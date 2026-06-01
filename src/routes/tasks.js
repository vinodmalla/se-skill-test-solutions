const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// not used anywhere yet
//bug 5 — Unused helper function in tasks.js so remove it to keep the code clean and avoid confusion.


router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message }); //bug 9 --stack: err.stack exposes sensitive info, so we should remove it from the error response to avoid potential security risks.
  }
});

//bug 6 -router delete is redundant, we can remove one of them to avoid confusion and potential bugs. The remaining delete endpoint will still allow users to delete their tasks as intended without any issues.
/*router.delete('/:id', authMiddleware, async (req, res) => {
    await pool.query('DELETE FROM tasks WHERE id = ' + req.params.id + ' AND user_id = ' + req.user.id);
    res.json({ message: 'Task deleted' });
  
}); */

//adding new feature to create a new task feature with a POST endpoint. This will allow users to create new tasks and save them to the database, which is a core functionality of the TaskFlow application.
router.post('/tasks', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, status, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message }); //bug 9 --stack: err.stack exposes sensitive info, so we should remove it from the error response to avoid potential security risks.
  }
});

router.put('/tasks/:id', authMiddleware, async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, description, status, req.params.id, req.user.id]
    );
    //bug 7 -the update task endpoint is missing a response, so the client will never receive confirmation that the update was successful. We should return the updated task in the response body to confirm that the changes were saved correctly.
    // Bug 8 Fix: Added 404 check — original silently returned undefined if task not found
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message }); //bug 9 --stack: err.stack exposes sensitive info, so we should remove it from the error response to avoid potential security risks.
  }
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    //fixed- parameterized query to prevent SQL injection vulnerabilities and enhance security. This way, user input is safely handled and cannot be used to manipulate the SQL query maliciously.
    // fixed — parameterised query
await pool.query(
  'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
  [req.params.id, req.user.id]
);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;