// controllers/blogController.js
import Blog from '../models/Blog.js';

// Get all published blogs
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 }).lean();
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch blogs', error: error.message });
    }
};

// Get all blogs (including unpublished - for admin)
export const getAllBlogsAdmin = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 }).lean();
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch blogs', error: error.message });
    }
};

// Get single blog by ID
export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findOne({ id: parseInt(id) }).lean();

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ message: 'Failed to fetch blog', error: error.message });
    }
};

// Create new blog (Admin)
export const createBlog = async (req, res) => {
    try {
        const { title, subHeading, category, content, author, metaTitle, metaDescription } = req.body;

        // Validate required fields
        if (!title || !subHeading || !category || !content) {
            return res.status(400).json({ message: 'Title, subHeading, category, and content are required' });
        }

        if (!req.files || !req.files.mainImage) {
            return res.status(400).json({ message: 'Main image is required' });
        }

        // Get the next ID
        const lastBlog = await Blog.findOne().sort({ id: -1 });
        const nextId = lastBlog ? lastBlog.id + 1 : 1;

        // Handle multiple content images
        const contentImages = req.files.contentImages 
            ? req.files.contentImages.map(file => file.path) 
            : [];

        // Format author date
        const authorDate = `By ${author || 'Admin'} — ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })}`;

        const newBlog = new Blog({
            id: nextId,
            title,
            subHeading,
            category,
            mainImage: req.files.mainImage[0].path,
            content,
            contentImages,
            metaTitle,
            metaDescription,
            author: author || 'Admin',
            authorDate
        });

        await newBlog.save();
        res.status(201).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Failed to create blog', error: error.message });
    }
};

// Update blog (Admin)
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle main image update
        if (req.files && req.files.mainImage) {
            updateData.mainImage = req.files.mainImage[0].path;
        }

        // Handle content images update
        if (req.files && req.files.contentImages) {
            updateData.contentImages = req.files.contentImages.map(file => file.path);
        }

        // Update author date if author changed
        if (updateData.author) {
            updateData.authorDate = `By ${updateData.author} — ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            })}`;
        }

        const blog = await Blog.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updateData, updatedAt: Date.now() },
            { new: true }
        ).lean();

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog updated successfully', blog });
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Failed to update blog', error: error.message });
    }
};

// Delete blog (Admin)
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findOneAndDelete({ id: parseInt(id) });

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Failed to delete blog', error: error.message });
    }
};

// Toggle blog published status (Admin)
export const toggleBlogPublished = async (req, res) => {
    try {
        const { id } = req.params;
        const blog = await Blog.findOne({ id: parseInt(id) });

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        blog.published = !blog.published;
        await blog.save();

        res.status(200).json({ 
            message: `Blog ${blog.published ? 'published' : 'unpublished'} successfully`, 
            blog 
        });
    } catch (error) {
        console.error('Error toggling blog status:', error);
        res.status(500).json({ message: 'Failed to toggle blog status', error: error.message });
    }
};
