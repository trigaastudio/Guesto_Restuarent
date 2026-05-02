import Cart from '../models/cartSchema.js';

class CartController {
  // @desc    Add item to cart or update quantity in array
  // @route   POST /api/cart
  // @access  Private
  async addToCart(req, res) {
    try {
      const { menuItemId, quantity, size } = req.body;
      const userId = req.user._id;

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        // Create new cart for user
        cart = await Cart.create({
          user: userId,
          items: [{ menuItem: menuItemId, quantity: quantity || 1, size }]
        });
      } else {
        // Check if item already exists in items array with SAME size
        const itemIndex = cart.items.findIndex(item => 
          item.menuItem.toString() === menuItemId && item.size === size
        );

        if (itemIndex > -1) {
          // Update existing item quantity
          cart.items[itemIndex].quantity += (quantity || 1);
        } else {
          // Add new item to array
          cart.items.push({ menuItem: menuItemId, quantity: quantity || 1, size });
        }
        await cart.save();
      }

      await cart.populate('items.menuItem');

      res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: cart
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Get user's cart (single document)
  // @route   GET /api/cart
  // @access  Private
  async getCart(req, res) {
    try {
      const userId = req.user._id;
      const cart = await Cart.findOne({ user: userId }).populate('items.menuItem');

      const transformedItems = cart ? cart.items.map(item => ({
        ...item.menuItem.toObject(),
        quantity: item.quantity,
        selectedSize: item.size,
        cartItemId: item._id
      })) : [];

      res.status(200).json({
        success: true,
        data: transformedItems
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Update quantity of an item in the items array
  // @route   PUT /api/cart/:menuItemId
  // @access  Private
  async updateQuantity(req, res) {
    try {
      const { quantity, size } = req.body;
      const menuItemId = req.params.id;
      const userId = req.user._id;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) throw new Error('Cart not found');

      const itemIndex = cart.items.findIndex(item => 
        item.menuItem.toString() === menuItemId && item.size === size
      );

      if (itemIndex > -1) {
        if (quantity < 1) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        await cart.save();
        await cart.populate('items.menuItem');
      }

      res.status(200).json({
        success: true,
        data: cart.items
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Remove item from array
  // @route   DELETE /api/cart/:menuItemId
  // @access  Private
  async removeFromCart(req, res) {
    try {
      const menuItemId = req.params.id;
      const { size } = req.query; // Expecting size in query param
      const userId = req.user._id;

      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        cart.items = cart.items.filter(item => 
          !(item.menuItem.toString() === menuItemId && item.size === size)
        );
        await cart.save();
      }

      res.status(200).json({
        success: true,
        message: 'Item removed from cart'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // @desc    Clear entire items array
  // @route   DELETE /api/cart
  // @access  Private
  async clearCart(req, res) {
    try {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
      res.status(200).json({
        success: true,
        message: 'Cart cleared'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new CartController();

