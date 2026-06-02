import Cart from '../models/cartSchema.js';
import Menu from '../models/menuSchema.js';

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
      .filter(item => item.menuItem)
      .map(item => {
        let menuData = {};
        if (item.menuItem.toObject) {
          menuData = item.menuItem.toObject();
        } else if (typeof item.menuItem === 'object') {
          menuData = item.menuItem;
        }

        return {
          ...menuData,
          menuItemId: menuData._id, 
          quantity: item.quantity,
          selectedSize: item.size,
          bogoItem: item.bogoItem,
          _id: item._id 
        };
      });
  }

  async addToCart(req, res) {
    try {
      const { menuItemId, quantity, size, selectedSize } = req.body;
      const finalSize = size || selectedSize; 
      const userId = req.user._id;

      let cart = await Cart.findOne({ user: userId });
      
      
      const menuItem = await Menu.findById(menuItemId);
      const variant = menuItem?.variants?.find(v => v.size === finalSize);
      
      const bogoInfo = (variant?.isBOGO && variant?.bogoItem) ? {
        name: variant.bogoItem?.name || (await Menu.findById(variant.bogoItem?._id || variant.bogoItem))?.name || 'Free Item',
        size: variant.bogoVariant || '',
        quantity: quantity || 1
      } : null;

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [{ menuItem: menuItemId, quantity: quantity || 1, size: finalSize, bogoItem: bogoInfo }]
        });
      } else {
        const itemIndex = cart.items.findIndex(item => 
          item.menuItem.toString() === menuItemId && item.size === finalSize
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += (quantity || 1);
          if (bogoInfo) {
             cart.items[itemIndex].bogoItem = {
               ...bogoInfo,
               quantity: cart.items[itemIndex].quantity
             };
          }
        } else {
          cart.items.push({ menuItem: menuItemId, quantity: quantity || 1, size: finalSize, bogoItem: bogoInfo });
        }
        await cart.save();
      }

      await cart.populate({
        path: 'items.menuItem',
        populate: [
          {
            path: 'category',
            model: 'Category'
          },
          {
            path: 'variants.includedItems.menuItem',
            model: 'Menu'
          },
          {
            path: 'comboItems.menuItem',
            model: 'Menu'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: { items: this._transformCartItems(cart) }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.user._id;
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.menuItem',
        populate: [
          {
            path: 'category',
            model: 'Category'
          },
          {
            path: 'variants.includedItems.menuItem',
            model: 'Menu'
          },
          {
            path: 'comboItems.menuItem',
            model: 'Menu'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: { items: this._transformCartItems(cart) }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateQuantity(req, res) {
    try {
      const { quantity } = req.body;
      const itemId = req.params.id; 
      const userId = req.user._id;

      const cart = await Cart.findOne({ user: userId });
      if (!cart) throw new Error('Cart not found');

      const item = cart.items.id(itemId);
      if (item) {
        if (quantity < 1) {
          cart.items.pull(itemId);
        } else {
          item.quantity = quantity;
          if (item.bogoItem) {
            item.bogoItem.quantity = quantity;
          }
        }
        await cart.save();
        await cart.populate({
          path: 'items.menuItem',
          populate: [
            {
              path: 'category',
              model: 'Category'
            },
            {
              path: 'variants.includedItems.menuItem',
              model: 'Menu'
            },
            {
              path: 'comboItems.menuItem',
              model: 'Menu'
            }
          ]
        });
      }

      res.status(200).json({
        success: true,
        data: { items: this._transformCartItems(cart) }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeFromCart(req, res) {
    try {
      const itemId = req.params.id;
      const userId = req.user._id;

      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        cart.items.pull(itemId);
        await cart.save();
      }

      const updatedCart = await Cart.findOne({ user: userId }).populate({
        path: 'items.menuItem',
        populate: [
          {
            path: 'category',
            model: 'Category'
          },
          {
            path: 'variants.includedItems.menuItem',
            model: 'Menu'
          },
          {
            path: 'comboItems.menuItem',
            model: 'Menu'
          }
        ]
      });

      res.status(200).json({
        success: true,
        data: { items: this._transformCartItems(updatedCart) }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async clearCart(req, res) {
    try {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
      res.status(200).json({
        success: true,
        message: 'Cart cleared',
        data: { items: [] }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new CartController();
