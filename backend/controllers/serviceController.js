const pool = require('../config/db');

// @desc    Get all service categories
// @route   GET /api/services/categories
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM service_categories ORDER BY name ASC');
    return res.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Get Categories Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching categories', error: error.message });
  }
};

// @desc    Get all services (with availability status & availed badge count)
// @route   GET /api/services
const getServices = async (req, res) => {
  try {
    const { category_id, status } = req.query;
    let query = `
      SELECT s.id, s.category_id, c.name AS category_name, s.name, s.description,
             s.price, s.duration_minutes, s.status, s.created_at,
             (SELECT COUNT(*) FROM bookings b WHERE b.service_id = s.id AND b.status IN ('PENDING', 'CONFIRMED')) AS active_bookings_count
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      query += ` AND s.category_id = ?`;
      params.push(category_id);
    }

    if (status) {
      query += ` AND s.status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY c.name ASC, s.name ASC`;

    const [services] = await pool.query(query, params);

    // Attach badge string: 'Availed' if active bookings exist, else 'Available'
    const formatted = services.map(srv => ({
      ...srv,
      availment_badge: srv.active_bookings_count > 0 ? 'Availed' : 'Available'
    }));

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Get Services Error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching services', error: error.message });
  }
};

// @desc    Create a new service (Admin only)
// @route   POST /api/services
const createService = async (req, res) => {
  try {
    const { category_id, name, description, price, duration_minutes, status } = req.body;

    if (!category_id || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Category, service name, and price are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO services (category_id, name, description, price, duration_minutes, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, name, description || '', price, duration_minutes || 30, (status || 'AVAILABLE').toUpperCase()]
    );

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { id: result.insertId, category_id, name, price, status: status || 'AVAILABLE' }
    });
  } catch (error) {
    console.error('Create Service Error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating service', error: error.message });
  }
};

// @desc    Update service details (Admin only)
// @route   PUT /api/services/:id
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, duration_minutes, status } = req.body;

    const [existing] = await pool.query('SELECT id FROM services WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await pool.query(
      `UPDATE services 
       SET category_id = COALESCE(?, category_id),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           duration_minutes = COALESCE(?, duration_minutes),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE id = ?`,
      [category_id, name, description, price, duration_minutes, status ? status.toUpperCase() : null, id]
    );

    return res.json({ success: true, message: 'Service updated successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Update Service Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating service', error: error.message });
  }
};

// @desc    Delete service (Admin only)
// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT id FROM services WHERE id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Service deleted successfully', id: parseInt(id) });
  } catch (error) {
    console.error('Delete Service Error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting service', error: error.message });
  }
};

module.exports = { getCategories, getServices, createService, updateService, deleteService };
