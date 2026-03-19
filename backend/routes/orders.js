const express = require("express");
const router = express.Router();
const Order = require('../models/order.js');

// GET all orders
router.get("/", async (req, res) => {
  try {
    console.log('📋 GET /orders - Fetching all orders');
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`📋 Found ${orders.length} orders in database`);
    res.json(orders);
  } catch (err) {
    console.error('❌ GET /orders error:', err.message);
    res.status(500).json({ error: "Failed to fetch orders", details: err.message });
  }
});

// GET single order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// POST new order
router.post("/", async (req, res) => {
  try {
    console.log('📦 POST /orders - Received order:', JSON.stringify(req.body, null, 2));
    const { items, total, deliveryCharge, address, paymentMethod, userId, userEmail, notes } = req.body;
    
    if (!items || !total || !address) {
      console.error('❌ Missing required fields:', { hasItems: !!items, hasTotal: !!total, hasAddress: !!address });
      return res.status(400).json({ error: 'Missing required fields: items, total, address' });
    }

    if (!Array.isArray(items)) {
      console.error('❌ Items is not an array:', typeof items);
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const newOrder = new Order({
      items,
      total,
      deliveryCharge: deliveryCharge || 0,
      address,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      userId,
      userEmail,
      notes,
      status: 'Confirmed'
    });

    console.log('💾 Saving order to database...');
    await newOrder.save();
    console.log('✅ Order created successfully:', newOrder._id);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('❌ POST /orders error:', err.message);
    console.error('❌ Full error:', err);
    res.status(500).json({ error: "Failed to create order", details: err.message });
  }
});

// PUT update order
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

module.exports = router;