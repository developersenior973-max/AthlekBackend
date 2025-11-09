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
  if (blogObj.url) {
    const normalized = normalizeBlogUrl(blogObj.url);
    if (normalized) {
      blogObj.url = normalized;
    }
  }
  return blogObj;
};

const normalizeBlogUrl = (value = "") => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";

  const withoutDomain = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  let slug = withoutDomain.replace(/^\/+/, "");

  if (slug.startsWith("blog/")) {
    slug = slug.slice(5);
  }

  slug = slug
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug;
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

    const decodedSlug = decodeURIComponent(slug || "").trim();
    const normalizedSlug = normalizeBlogUrl(decodedSlug);

    const candidates = [];
    if (normalizedSlug) {
      candidates.push(normalizedSlug);
      candidates.push(`/blog/${normalizedSlug}`);
      candidates.push(`blog/${normalizedSlug}`);
    }
    if (decodedSlug) {
      candidates.push(decodedSlug);
    }

    let blog = await Blog.findOne({ url: { $in: candidates }, isActive: true });

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
    const normalizedUrl = normalizeBlogUrl(url || "");
    
    if (!normalizedUrl) {
      return res.status(400).json({
        error: "A valid blog URL (slug) is required"
      });
    }
    
    // Check if URL already exists
    const urlCandidates = [normalizedUrl, `/blog/${normalizedUrl}`, `blog/${normalizedUrl}`];
    const existingBlog = await Blog.findOne({ url: { $in: urlCandidates } });
    if (existingBlog) {
      return res.status(400).json({ 
        error: "A blog with this URL already exists" 
      });
    }
    
    const blog = new Blog({
      adminName,
      url: normalizedUrl,
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
    if (Object.prototype.hasOwnProperty.call(updateData, "url")) {
      const normalizedUrl = normalizeBlogUrl(updateData.url || "");
      if (!normalizedUrl) {
        return res.status(400).json({
          error: "A valid blog URL (slug) is required"
        });
      }

      const urlCandidates = [normalizedUrl, `/blog/${normalizedUrl}`, `blog/${normalizedUrl}`];
      const existingBlog = await Blog.findOne({ 
        url: { $in: urlCandidates },
        _id: { $ne: id }
      });
      if (existingBlog) {
        return res.status(400).json({ 
          error: "A blog with this URL already exists" 
        });
      }
      updateData.url = normalizedUrl;
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

