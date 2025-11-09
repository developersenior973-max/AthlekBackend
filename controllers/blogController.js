import mongoose from "mongoose";
import Blog from "../models/Blog.js";

const formatBlog = (blog, req) => {
  if (!blog) return null;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const blogObj = blog.toObject ? blog.toObject() : { ...blog };
  if (blogObj.coverImage) {
    if (!blogObj.coverImage.startsWith('http')) {
      blogObj.coverImage = `${baseUrl}${blogObj.coverImage.startsWith('/') ? '' : '/'}${blogObj.coverImage}`;
    }
  } else {
    blogObj.coverImage = "";
  }
  return blogObj;
};

// Get all blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    
    const formatted = blogs.map((blog) => formatBlog(blog, req));
    res.json({ data: formatted });
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
    
    const formatted = blogs.map((blog) => formatBlog(blog, req));
    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get single blog by URL (public)
export const getPublicBlogByUrl = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, error: "Blog slug is required" });
    }

    const normalizedSlug = decodeURIComponent(slug).trim();

    let blog = await Blog.findOne({ url: normalizedSlug, isActive: true });

    if (!blog && mongoose.Types.ObjectId.isValid(normalizedSlug)) {
      blog = await Blog.findOne({ _id: normalizedSlug, isActive: true });
    }

    if (!blog) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }

    res.json({ success: true, data: formatBlog(blog, req) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    
    res.json({ data: formatBlog(blog, req) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new blog
export const createBlog = async (req, res) => {
  try {
    const { adminName, url, content, isActive, coverImage } = req.body;
    
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
      coverImage: coverImage || "",
      isActive: isActive !== undefined ? isActive : true
    });
    
    await blog.save();
    
    res.status(201).json({
      message: "Blog created successfully",
      blog: formatBlog(blog, req)
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
    
    if (Object.prototype.hasOwnProperty.call(updateData, 'coverImage')) {
      if (!updateData.coverImage) {
        updateData.coverImage = "";
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
      blog: formatBlog(blog, req)
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
      blog: formatBlog(blog, req)
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
      blog: formatBlog(blog, req)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

