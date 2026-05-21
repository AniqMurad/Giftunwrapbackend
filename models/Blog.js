// models/Blog.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    subHeading: { type: String, required: true },
    category: { type: String, required: true },
    mainImage: { type: String, required: true },
    content: { type: String, required: true },
    contentImages: [{ type: String }],
    author: { type: String, default: 'Admin' },
    authorDate: { type: String },
    published: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
blogSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
