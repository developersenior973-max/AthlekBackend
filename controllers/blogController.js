import Blog from "../models/Blog.js";

// Get all blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    
    res.json({ data: blogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active blogs (public)
export const getActiveBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(4); // Limit to 4 for COMMUNITY FAVOURITES section
    
    res.json({ success: true, data: blogs });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get blog by ID
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    
    res.json({ data: blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new blog
export const createBlog = async (req, res) => {
  try {
    const { adminName, url, content, isActive } = req.body;
    
    // Check if URL already exists
    const existingBlog = await Blog.findOne({ url });
    if (existingBlog) {
      return res.status(400).json({ 
        error: "A blog with this URL already exists" 
      });
    }
    
    const blog = new Blog({
      adminName,
      url,
      content,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await blog.save();
    
    res.status(201).json({
      message: "Blog created successfully",
      blog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If URL is being updated, check for duplicates
    if (updateData.url) {
      const existingBlog = await Blog.findOne({ 
        url: updateData.url,
        _id: { $ne: id }
      });
      if (existingBlog) {
        return res.status(400).json({ 
          error: "A blog with this URL already exists" 
        });
      }
    }
    
    const blog = await Blog.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    
    res.json({
      message: "Blog updated successfully",
      blog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndDelete(id);
    
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    
    res.json({
      message: "Blog deleted successfully",
      blog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle blog active status
export const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    
    blog.isActive = !blog.isActive;
    blog.updatedAt = Date.now();
    await blog.save();
    
    res.json({
      message: "Blog status updated successfully",
      blog
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

