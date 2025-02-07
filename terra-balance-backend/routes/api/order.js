const express = require('express');
const router = express.Router();
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Order = require('../../models/order');
const Cart = require('../../models/cart');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const mailgun = require('../../services/mailgun');
const store = require('../../utils/store');
const { ROLES, CART_ITEM_STATUS, ORDER_STATUS, PAYMENT_METHODS } = require('../../constants');

// Utility function to transform order for response
const transformOrder = (order) => ({
  id: order._id,
  orderNumber: order.orderNumber,
  total: parseFloat(Number(order.total.toFixed(2))),
  subtotal: parseFloat(Number(order.subtotal.toFixed(2))),
  tax: parseFloat(Number(order.tax.toFixed(2))),
  shipping: parseFloat(Number(order.shipping.toFixed(2))),
  status: order.status,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  created: order.created,
  products: order.products.map(item => ({
    id: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
    discountPercent: item.discountPercent,
    image: item.product.imageUrl
  }))
});

router.post('/add', auth, async (req, res) => {
  try {
    const { 
      cartId, 
      total, 
      subtotal, 
      tax, 
      shipping, 
      paymentMethod, 
      shippingAddress 
    } = req.body;

    // Validate payment method
    if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      return res.status(400).json({
        error: {
          type: 'validationError',
          detail: 'Invalid payment method'
        }
      });
    }

    const cart = await Cart.findById(cartId).populate('products.product');
    
    if (!cart) {
      return res.status(404).json({
        error: {
          type: 'notFound',
          detail: 'Cart not found'
        }
      });
    }

    const order = new Order({
      cart: cartId,
      user: req.user._id,
      products: cart.products.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
        discountPercent: item.product.discountPercent || 0
      })),
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      shippingAddress,
      status: ORDER_STATUS.PENDING
    });

    const orderDoc = await order.save();

    // Send confirmation email
    await mailgun.sendEmail(req.user.email, 'order-confirmation', {
      orderNumber: orderDoc.orderNumber,
      total: orderDoc.total,
      products: orderDoc.products
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: orderDoc._id,
        orderNumber: orderDoc.orderNumber
      }
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not process your order. Please try again.'
      }
    });
  }
});

// search orders api
router.get('/search', auth, async (req, res) => {
  try {
    const { search } = req.query;

    if (!Mongoose.Types.ObjectId.isValid(search)) {
      return res.status(200).json({
        orders: []
      });
    }

    let ordersDoc = null;

    if (req.user.role === ROLES.Admin) {
      ordersDoc = await Order.find({
        _id: Mongoose.Types.ObjectId(search)
      }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand'
          }
        }
      });
    } else {
      const user = req.user._id;
      ordersDoc = await Order.find({
        _id: Mongoose.Types.ObjectId(search),
        user
      }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand'
          }
        }
      });
    }

    ordersDoc = ordersDoc.filter(order => order.cart);

    if (ordersDoc.length > 0) {
      const newOrders = ordersDoc.map(o => {
        return {
          _id: o._id,
          total: parseFloat(Number(o.total.toFixed(2))),
          created: o.created,
          products: o.cart?.products
        };
      });

      let orders = newOrders.map(o => store.caculateTaxAmount(o));
      orders.sort((a, b) => b.created - a.created);
      res.status(200).json({
        orders
      });
    } else {
      res.status(200).json({
        orders: []
      });
    }
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not fetch orders. Please try again.'
      }
    });
  }
});

// fetch orders api
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const ordersDoc = await Order.find()
      .sort('-created')
      .populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand'
          }
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Order.countDocuments();
    const orders = store.formatOrders(ordersDoc);

    res.status(200).json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      count
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not fetch orders. Please try again.'
      }
    });
  }
});

// fetch my orders api
router.get('/me', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      sortBy = 'created',
      sortOrder = 'desc' 
    } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const orders = await Order.find(query)
      .populate({
        path: 'products.product',
        select: 'name imageUrl price'
      })
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const count = await Order.countDocuments(query);

    const transformedOrders = orders.map(transformOrder);

    res.status(200).json({
      orders: transformedOrders,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      count
    });
  } catch (error) {
    console.error('Fetch user orders error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not fetch orders. Please try again.'
      }
    });
  }
});

// fetch order api
router.get('/:orderId', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Check if orderId is a valid MongoDB ObjectId
    if (!Mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        error: {
          type: 'validationError',
          detail: 'Invalid order ID'
        }
      });
    }

    let orderDoc = null;

    if (req.user.role === ROLES.Admin) {
      orderDoc = await Order.findOne({ _id: orderId }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand'
          }
        }
      });
    } else {
      const user = req.user._id;
      orderDoc = await Order.findOne({ _id: orderId, user }).populate({
        path: 'cart',
        populate: {
          path: 'products.product',
          populate: {
            path: 'brand'
          }
        }
      });
    }

    if (!orderDoc || !orderDoc.cart) {
      return res.status(404).json({
        error: {
          type: 'notFound',
          detail: 'Order not found'
        }
      });
    }

    let order = {
      _id: orderDoc._id,
      total: orderDoc.total,
      created: orderDoc.created,
      totalTax: 0,
      products: orderDoc?.cart?.products,
      cartId: orderDoc.cart._id
    };

    order = store.caculateTaxAmount(order);

    res.status(200).json({
      order
    });
  } catch (error) {
    console.error('Fetch order error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not fetch order details. Please try again.'
      }
    });
  }
});

router.delete('/cancel/:orderId', auth, async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ _id: orderId });
    const foundCart = await Cart.findOne({ _id: order.cart });

    increaseQuantity(foundCart.products);

    await Order.deleteOne({ _id: orderId });
    await Cart.deleteOne({ _id: order.cart });

    res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not cancel order. Please try again.'
      }
    });
  }
});

router.put('/status/item/:itemId', auth, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const orderId = req.body.orderId;
    const cartId = req.body.cartId;
    const status = req.body.status || CART_ITEM_STATUS.Cancelled;

    const foundCart = await Cart.findOne({ 'products._id': itemId });
    const foundCartProduct = foundCart.products.find(p => p._id == itemId);

    await Cart.updateOne(
      { 'products._id': itemId },
      {
        'products.$.status': status
      }
    );

    if (status === CART_ITEM_STATUS.Cancelled) {
      await Product.updateOne(
        { _id: foundCartProduct.product },
        { $inc: { quantity: foundCartProduct.quantity } }
      );

      const cart = await Cart.findOne({ _id: cartId });
      const items = cart.products.filter(
        item => item.status === CART_ITEM_STATUS.Cancelled
      );

      // All items are cancelled => Cancel order
      if (cart.products.length === items.length) {
        await Order.deleteOne({ _id: orderId });
        await Cart.deleteOne({ _id: cartId });

        return res.status(200).json({
          success: true,
          orderCancelled: true,
          message: `${
            req.user.role === ROLES.Admin ? 'Order' : 'Your order'
          } has been cancelled successfully`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Item has been cancelled successfully!'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item status has been updated successfully!'
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({
      error: {
        type: 'serverError',
        detail: 'Could not update item status. Please try again.'
      }
    });
  }
});

const increaseQuantity = products => {
  let bulkOptions = products.map(item => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: item.quantity } }
      }
    };
  });

  Product.bulkWrite(bulkOptions);
};

module.exports = router;
