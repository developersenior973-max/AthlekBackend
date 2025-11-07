import CarouselImage from "../models/CarouselImage.js";

// Get all carousel images
export const getCarouselImages = async (req, res) => {
  try {
    const images = await CarouselImage.find().sort({ order: 1, createdAt: -1 });
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Transform images to include full URLs
    const transformedImages = images.map(image => ({
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order,
      isActive: image.isActive,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    }));
    
    res.json({ data: transformedImages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active carousel images (public)
export const getActiveCarouselImages = async (req, res) => {
  try {
    const images = await CarouselImage.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Transform images to include full URLs
    const transformedImages = images.map(image => ({
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order
    }));
    
    res.json({ success: true, data: transformedImages });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get carousel image by ID
export const getCarouselImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await CarouselImage.findById(id);
    
    if (!image) {
      return res.status(404).json({ message: "Carousel image not found" });
    }
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const transformedImage = {
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order,
      isActive: image.isActive,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };
    
    res.json({ data: transformedImage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new carousel image
export const createCarouselImage = async (req, res) => {
  try {
    const { imageUrl, order, isActive } = req.body;
    
    const image = new CarouselImage({
      imageUrl,
      order: order !== undefined ? order : 0,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await image.save();
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const transformedImage = {
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order,
      isActive: image.isActive,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };
    
    res.status(201).json({
      message: "Carousel image created successfully",
      image: transformedImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update carousel image
export const updateCarouselImage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const image = await CarouselImage.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!image) {
      return res.status(404).json({ message: "Carousel image not found" });
    }
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const transformedImage = {
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order,
      isActive: image.isActive,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };
    
    res.json({
      message: "Carousel image updated successfully",
      image: transformedImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete carousel image
export const deleteCarouselImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await CarouselImage.findByIdAndDelete(id);
    
    if (!image) {
      return res.status(404).json({ message: "Carousel image not found" });
    }
    
    res.json({
      message: "Carousel image deleted successfully",
      image
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle carousel image active status
export const toggleCarouselImageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const image = await CarouselImage.findById(id);
    if (!image) {
      return res.status(404).json({ message: "Carousel image not found" });
    }
    
    image.isActive = !image.isActive;
    image.updatedAt = Date.now();
    await image.save();
    
    // Get the base URL for images
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const transformedImage = {
      _id: image._id,
      imageUrl: image.imageUrl.startsWith('http') ? image.imageUrl : `${baseUrl}${image.imageUrl}`,
      order: image.order,
      isActive: image.isActive,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt
    };
    
    res.json({
      message: "Carousel image status updated successfully",
      image: transformedImage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

