const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_daybook',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const getNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await pool.query('SELECT * FROM notes WHERE user_id = ? ORDER BY is_pinned DESC, updated_at DESC', [userId]);
        res.json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createNote = async (req, res) => {
    try {
        console.log("createNote hit: ", req.body);
        const userId = req.user.id;
        const { title, content, color, is_pinned } = req.body;

        const [result] = await pool.query(
            'INSERT INTO notes (user_id, title, content, color, is_pinned) VALUES (?, ?, ?, ?, ?)',
            [userId, title || '', content || '', color || '#ffffff', is_pinned || false]
        );

        const [newNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, data: newNote[0] });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const updateNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, content, color, is_pinned } = req.body;

        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        await pool.query(
            'UPDATE notes SET title = ?, content = ?, color = ?, is_pinned = ? WHERE id = ? AND user_id = ?',
            [title, content, color, is_pinned, id, userId]
        );

        const [updatedNote] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        res.json({ success: true, data: updatedNote[0] });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [result] = await pool.query('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.json({ success: true, data: {} });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote
};
