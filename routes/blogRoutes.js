// routes/blogRoutes.js
import express from 'express';
import {
    getAllBlogs,
    getAllBlogsAdmin,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    toggleBlogPublished
} from '../controllers/blogController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Admin routes
router.get('/admin/all', getAllBlogsAdmin);
router.post('/', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 }
]), createBlog);
router.put('/:id', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 10 }
]), updateBlog);
router.delete('/:id', deleteBlog);
router.patch('/:id/toggle-published', toggleBlogPublished);

export default router;
