import Quote from '../models/Quote.js';

// Create a new quote request
export const createQuote = async (req, res) => {
  try {
    const {
      productId,
      productName,
      productImage,
      companyName,
      quantity,
      email,
      phoneNumber,
      additionalRequirements,
    } = req.body;

    // Validate required fields
    if (!productId || !productName || !companyName || !quantity || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // Create new quote
    const newQuote = new Quote({
      productId,
      productName,
      productImage,
      companyName,
      quantity,
      email,
      phoneNumber: phoneNumber || null,
      additionalRequirements: additionalRequirements || null,
    });

    await newQuote.save();

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      data: newQuote,
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quote request',
      error: error.message,
    });
  }
};

// Get all quotes (for admin)
export const getAllQuotes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const quotes = await Quote.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Quote.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: quotes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalQuotes: count,
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotes',
      error: error.message,
    });
  }
};

// Get a single quote by ID
export const getQuoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findById(id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quote',
      error: error.message,
    });
  }
};

// Update quote status
export const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'contacted', 'quoted', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const quote = await Quote.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote status updated successfully',
      data: quote,
    });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update quote',
      error: error.message,
    });
  }
};

// Delete a quote
export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await Quote.findByIdAndDelete(id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quote',
      error: error.message,
    });
  }
};
