console.log("🔥 products.js LOADED");

const express = require("express");
const router = express.Router();
const Product = require('../models/product.js');

// Helper function to validate image URL format
const isValidImageUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = urlObj.pathname.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.endsWith(ext)) || 
           urlObj.hostname.includes('cloudinary') || 
           urlObj.hostname.includes('imgur') ||
           urlObj.hostname.includes('unsplash') ||
           urlObj.hostname.includes('pexels');
  } catch (e) {
    return false;
  }
};

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ADD product
router.post("/", async (req, res) => {
  try {
    const { name, brand, category, size, price, originalPrice, image, description, inStock } = req.body;
    
    if (!name || !brand || !category || !size || !price || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate image URL
    if (!isValidImageUrl(image)) {
      return res.status(400).json({ error: 'Invalid image URL. Please provide a valid image URL.' });
    }

    const newProduct = new Product({
      name,
      brand,
      category,
      size,
      price,
      originalPrice,
      image,
      description,
      inStock: inStock !== undefined ? inStock : true
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product
router.put("/:id", async (req, res) => {
  try {
    // Validate image URL if provided
    if (req.body.image && !isValidImageUrl(req.body.image)) {
      return res.status(400).json({ error: 'Invalid image URL. Please provide a valid image URL.' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

