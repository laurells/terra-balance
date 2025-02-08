const express = require('express');
const router = express.Router();
const multer = require('multer');
const Mongoose = require('mongoose');

// Bring in Models & Utils
const Product = require('../../models/product');
const Brand = require('../../models/brand');
const Category = require('../../models/category');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const checkAuth = require('../../utils/auth');
const { s3Upload } = require('../../utils/storage');
const { ROLES } = require('../../constants');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Transform product to match frontend itemType
const transformProduct = (product) => ({
  id: product._id,
  name: product.name,
  price: product.price,
  qty: 1, // Default quantity
  discountPercent: product.discountPercent || 0,
  description: product.description,
  detail: product.detail,
  categoryId: product.category,
  stock: product.stock,
  createdAt: product.created?.toISOString(),
  updatedAt: product.updated?.toISOString(),
  img1: product.imageUrl,
  img2: product.imageUrl2,
  categoryName: product.categoryName,
  category: product.category ? {
    id: product.category._id,
    name: product.category.name,
    description: product.category.description,
    thumbnailImage: product.category.thumbnailImage,
    createdAt: product.category.created?.toISOString(),
    updatedAt: product.category.updated?.toISOString()
  } : null
});

// Fetch single product by slug
router.get('/item/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({ slug, isActive: true })
      .populate([
        { path: 'brand', select: 'name isActive slug' },
        { path: 'category', select: 'name description thumbnailImage created updated' }
      ]);

    if (!productDoc) {
      return res.status(404).json({
        error: { 
          type: 'notFound', 
          detail: { message: 'No product found.' } 
        }
      });
    }

    res.status(200).json({
      product: transformProduct(productDoc)
    });
  } catch (error) {
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

// Search products by name
router.get('/list/search/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const productDocs = await Product.find({
      name: { $regex: new RegExp(name), $options: 'is' },
      isActive: true
    }).populate('category');

    if (productDocs.length === 0) {
      return res.status(404).json({
        error: { 
          type: 'notFound', 
          detail: { message: 'No products found.' } 
        }
      });
    }

    const transformedProducts = productDocs.map(transformProduct);

    res.status(200).json({
      data: transformedProducts
    });
  } catch (error) {
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

// Fetch products with advanced filtering
router.get('/list', async (req, res) => {
  try {
    let {
      sortOrder,
      rating,
      max,
      min,
      category,
      brand,
      page = 1,
      limit = 10
    } = req.query;
    sortOrder = JSON.parse(sortOrder);

    const categoryFilter = category ? { category } : {};
    const basicQuery = [];

    const userDoc = await checkAuth(req);
    const categoryDoc = await Category.findOne({
      slug: categoryFilter.category,
      isActive: true
    });

    if (categoryDoc) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products)
          }
        }
      });
    }

    const brandDoc = await Brand.findOne({
      slug: brand,
      isActive: true
    });

    if (brandDoc) {
      basicQuery.push({
        $match: {
          'brand._id': { $eq: brandDoc._id }
        }
      });
    }

    let products = null;
    const productsCount = await Product.aggregate(basicQuery);
    const count = productsCount.length;
    const size = count > limit ? page - 1 : 0;
    const currentPage = count > limit ? Number(page) : 1;

    // paginate query
    const paginateQuery = [
      { $sort: sortOrder },
      { $skip: size * limit },
      { $limit: limit * 1 }
    ];

    if (userDoc) {
      const wishListQuery = basicQuery.concat(paginateQuery);
      products = await Product.aggregate(wishListQuery);
    } else {
      products = await Product.aggregate(basicQuery.concat(paginateQuery));
    }

    const transformedProducts = products.map(transformProduct);

    res.status(200).json({
      data: transformedProducts,
      totalPages: Math.ceil(count / limit),
      currentPage,
      count
    });
  } catch (error) {
    console.log('error', error);
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

router.get('/list/select', auth, async (req, res) => {
  try {
    const products = await Product.find({}, 'name');

    res.status(200).json({
      products
    });
  } catch (error) {
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

// New route for search with query parameter
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q;

    const productDocs = await Product.find({
      name: { $regex: new RegExp(q, 'i') },
      isActive: true
    }).populate('category');

    if (productDocs.length === 0) {
      return res.status(404).json({
        error: { 
          type: 'notFound', 
          detail: { message: 'No products found.' } 
        }
      });
    }

    const transformedProducts = productDocs.map(transformProduct);

    res.status(200).json({
      data: transformedProducts
    });
  } catch (error) {
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

// New route for counting products
router.get('/count', async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = category 
      ? { 'category.slug': category, isActive: true }
      : { isActive: true };

    const count = await Product.countDocuments(query);

    res.status(200).json({
      count
    });
  } catch (error) {
    res.status(400).json({
      error: { 
        type: 'serverError', 
        detail: { message: 'Your request could not be processed. Please try again.' } 
      }
    });
  }
});

// add product api
router.post(
  '/add',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  upload.single('image'),
  async (req, res) => {
    try {
      const sku = req.body.sku;
      const name = req.body.name;
      const description = req.body.description;
      const quantity = req.body.quantity;
      const price = req.body.price;
      const taxable = req.body.taxable;
      const isActive = req.body.isActive;
      const brand = req.body.brand;
      const image = req.file;

      if (!sku) {
        return res.status(400).json({ error: 'You must enter sku.' });
      }

      if (!description || !name) {
        return res
          .status(400)
          .json({ error: 'You must enter description & name.' });
      }

      if (!quantity) {
        return res.status(400).json({ error: 'You must enter a quantity.' });
      }

      if (!price) {
        return res.status(400).json({ error: 'You must enter a price.' });
      }

      const foundProduct = await Product.findOne({ sku });

      if (foundProduct) {
        return res.status(400).json({ error: 'This sku is already in use.' });
      }

      const { imageUrl, imageKey } = await s3Upload(image);

      const product = new Product({
        sku,
        name,
        description,
        quantity,
        price,
        taxable,
        isActive,
        brand,
        imageUrl,
        imageKey
      });

      const savedProduct = await product.save();

      res.status(200).json({
        success: true,
        message: `Product has been added successfully!`,
        product: transformProduct(savedProduct)
      });
    } catch (error) {
      return res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

// fetch products api
router.get(
  '/',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      let products = [];

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]?.['_id'];

        products = await Product.find({})
          .populate({
            path: 'brand',
            populate: {
              path: 'merchant',
              model: 'Merchant'
            }
          })
          .where('brand', brandId);
      } else {
        products = await Product.find({}).populate({
          path: 'brand',
          populate: {
            path: 'merchant',
            model: 'Merchant'
          }
        });
      }

      const transformedProducts = products.map(transformProduct);

      res.status(200).json({
        data: transformedProducts
      });
    } catch (error) {
      res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

// fetch product api
router.get(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;

      let productDoc = null;

      if (req.user.merchant) {
        const brands = await Brand.find({
          merchant: req.user.merchant
        }).populate('merchant', '_id');

        const brandId = brands[0]['_id'];

        productDoc = await Product.findOne({ _id: productId })
          .populate({
            path: 'brand',
            select: 'name'
          })
          .where('brand', brandId);
      } else {
        productDoc = await Product.findOne({ _id: productId }).populate({
          path: 'brand',
          select: 'name'
        });
      }

      if (!productDoc) {
        return res.status(404).json({
          error: { 
            type: 'notFound', 
            detail: { message: 'No product found.' } 
          }
        });
      }

      res.status(200).json({
        product: transformProduct(productDoc)
      });
    } catch (error) {
      res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

router.put(
  '/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };
      const { sku, slug } = req.body.product;

      const foundProduct = await Product.findOne({
        $or: [{ slug }, { sku }]
      });

      if (foundProduct && foundProduct._id != productId) {
        return res.status(400).json({ error: 'Sku or slug is already in use.' });
      }

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

router.put(
  '/:id/active',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true
      });

      res.status(200).json({
        success: true,
        message: 'Product has been updated successfully!'
      });
    } catch (error) {
      res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin, ROLES.Merchant),
  async (req, res) => {
    try {
      const product = await Product.deleteOne({ _id: req.params.id });

      res.status(200).json({
        success: true,
        message: `Product has been deleted successfully!`,
        product
      });
    } catch (error) {
      res.status(400).json({
        error: { 
          type: 'serverError', 
          detail: { message: 'Your request could not be processed. Please try again.' } 
        }
      });
    }
  }
);

module.exports = router;
