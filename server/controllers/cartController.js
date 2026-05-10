import Cart from '../models/cartSchema.js';

class CartController {
  constructor() {
    this.addToCart = this.addToCart.bind(this);
    this.getCart = this.getCart.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
    this.removeFromCart = this.removeFromCart.bind(this);
    this.clearCart = this.clearCart.bind(this);
  }

  _transformCartItems(cart) {
    if (!cart || !cart.items) return [];
    
    return cart.items
      .filter(item => item.menuItem) // Filter out items where the menu item might have been deleted
      .map(item => {
        let menuData = {};
        
        // Handle both populated and non-populated menuItem
        if (item.menuItem.toObject) {
          menuData = item.menuItem.toObject();
        } else if (typeof item.menuItem === 'object') {
          menuData = item.menuItem;
        }

        return {
          ...menuData,
          quantity: item.quantity,
          selectedSize: item.size,
          cartItemId: item._id
        };
      });
  }

  // @desc    Add item to cart or update quantity in array
  // @route   POST /api/cart
  // @access  Private
  async addToCart(req, res) {
    try {
      const { menuItemId, quantity, size } = req.body;
      const userId = req.user._id;

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [{ menuItem: menuItemId, quantity: quantity || 1, size }]
        });
      } else {
        const itemIndex = cart.items.findIndex(item => 
          item.menuItem.toString() === menuItemId && item.size === size
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += (quantity || 1);
        } else {
          cart.items.push({ menuItem: menuItemId, quantity: quantity || 1, size });
        }
        await cart.save();
      }

      await cart.populate({
        path: 'items.menuItem',
        populate: {
          path: 'variants.includedItems.menuItem',
          model: 'Menu'
        }
      });

      res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: this._transformCartItems(cart)
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // @desc    Get user's cart
  // @route   GET /api/cart
  // @access  Private
  async getCart(req, res) {
    try {
      const userId = req.user._id;
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.menuItem',
        populate: {
          path: 'variants.includedItems.menuItem',
          model: 'Menu'
        }
      });

      res.status(200).json({
        success: true,
        data: this._transformCartItems(cart)
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // @desc    Update quantity
  // @route   PUT /api/cart/:id
  // @access  Private
  async updateQuantity(req, res) {
    try {
      const { quantity, size } = req.body;
      const menuItemId = req.params.id;
      const userId = req.user._id;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) throw new Error('Cart not found');

      const itemIndex = cart.items.findIndex(item => {
        const itemSize = item.size || '';
        const targetSize = size || '';
        return item.menuItem.toString() === menuItemId && itemSize === targetSize;
      });

      if (itemIndex > -1) {
        if (quantity < 1) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        await cart.save();
        await cart.populate({
          path: 'items.menuItem',
          populate: {
            path: 'variants.includedItems.menuItem',
            model: 'Menu'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: this._transformCartItems(cart)
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
        cart.items = cart.items.filter(item => {
          const itemSize = item.size || '';
          const targetSize = size || '';
          return !(item.menuItem.toString() === menuItemId && itemSize === targetSize);
        });
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

