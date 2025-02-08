const chalk = require('chalk');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const setupDB = require('./db');
const { ROLES, EMAIL_PROVIDER } = require('../constants');
const User = require('../models/user');
const Brand = require('../models/brand');
const Product = require('../models/product');
const Category = require('../models/category');

const DEFAULT_ADMIN_EMAIL = 'admin@terrabalance.com';
const DEFAULT_ADMIN_PASSWORD = 'TerraBalance2024!';
const DEFAULT_ADMIN_FULLNAME = 'TerraBalance';

const NUM_PRODUCTS = 200;
const NUM_BRANDS = 15;
const NUM_CATEGORIES = 15;
const NUM_USERS = 20;

const seedUsers = async () => {
  const usersCount = await User.countDocuments();
  if (usersCount >= NUM_USERS) {
    console.log(`${chalk.yellow('!')} ${chalk.yellow('Sufficient number of users already exist, skipping seeding for users.')}`);
    return;
  }

  for (let i = 0; i < NUM_USERS; i++) {
    try {
      const fullname = faker.person.fullName();
      const email = faker.internet.email({ fullname });
      
      if (!fullname) {
        console.error(`${chalk.red('!')} Empty fullname generated, skipping user creation`);
        continue;
      }

      const user = new User({
        email,
        fullname,
        phone: faker.phone.number(),
        password: await bcrypt.hash('TestUser2024!', await bcrypt.genSalt(10)),
        role: faker.helpers.arrayElement([ROLES.Member, ROLES.Merchant]),
        shippingAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}, ${faker.location.country()} ${faker.location.zipCode()}`,
        isSubscribed: faker.datatype.boolean(),
        provider: EMAIL_PROVIDER.Email
      });

      console.log(chalk.blue('User object before save:'), user.toObject());

      await user.validate();

      await user.save();
    } catch (error) {
      console.error(chalk.red('Error creating user:'), error);
      
      if (error.name === 'ValidationError') {
        Object.keys(error.errors).forEach(key => {
          console.error(chalk.red(`Validation Error for ${key}:`), error.errors[key].message);
        });
      }
    }
  }
  console.log(`${chalk.green('✓')} ${chalk.green('Users seeding completed.')}`);
};

const seedProducts = async (categories, brands) => {
  const productsCount = await Product.countDocuments();
  if (productsCount >= NUM_PRODUCTS) {
    console.log(`${chalk.yellow('!')} ${chalk.yellow('Sufficient number of products already exist, skipping seeding for products.')}`);
    return;
  }

  const createdProducts = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const productName = faker.commerce.productName();
    const randomCategoryIndex = faker.number.int(categories.length - 1);
    const randomBrandIndex = faker.number.int(brands.length - 1);

    const product = new Product({
      sku: faker.string.alphanumeric(10).toUpperCase(),
      name: productName,
      description: faker.commerce.productDescription(),
      detail: faker.lorem.paragraph(),
      price: parseFloat(faker.commerce.price()),
      discountPercent: faker.number.int({ min: 0, max: 50 }),
      stock: faker.number.int({ min: 0, max: 500 }),
      quantity: faker.number.int({ min: 0, max: 100 }),
      imageUrl: faker.image.urlPicsumPhotos(),
      imageUrl2: faker.image.urlPicsumPhotos(),
      category: categories[randomCategoryIndex]._id,
      categoryName: categories[randomCategoryIndex].name,
      brand: brands[randomBrandIndex]._id,
      taxable: faker.datatype.boolean(),
      isActive: true
    });

    const savedProduct = await product.save();
    createdProducts.push(savedProduct);

    await Category.updateOne(
      { _id: categories[randomCategoryIndex]._id }, 
      { $push: { products: savedProduct._id } }
    );
  }

  console.log(`${chalk.green('✓')} ${chalk.green('Products seeded and associated with categories.')}`);
  return createdProducts;
};

const seedCategories = async () => {
  const categoriesCount = await Category.countDocuments();
  if (categoriesCount >= NUM_CATEGORIES) {
    console.log(`${chalk.yellow('!')} ${chalk.yellow('Sufficient number of categories already exist, skipping seeding for categories.')}`);
    return await Category.find();
  }

  const categories = [];
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    const category = new Category({
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      isActive: true
    });
    await category.save();
    categories.push(category);
  }
  console.log(`${chalk.green('✓')} ${chalk.green('Categories seeded.')}`);
  return categories;
};

const seedBrands = async () => {
  const brandsCount = await Brand.countDocuments();
  if (brandsCount >= NUM_BRANDS) {
    console.log(`${chalk.yellow('!')} ${chalk.yellow('Sufficient number of brands already exist, skipping seeding for brands.')}`);
    return await Brand.find();
  }

  const brands = [];
  for (let i = 0; i < NUM_BRANDS; i++) {
    const brand = new Brand({
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      isActive: true
    });
    await brand.save();
    brands.push(brand);
  }
  console.log(`${chalk.green('✓')} ${chalk.green('Brands seeded.')}`);
  return brands;
};

const seedDB = async (email = DEFAULT_ADMIN_EMAIL, password = DEFAULT_ADMIN_PASSWORD, fullname = DEFAULT_ADMIN_FULLNAME) => {
  try {
    // Check if admin user already exists
    let adminUser = await User.findOne({ email, role: ROLES.Admin });
    
    if (!adminUser) {
      // Create admin user only if it doesn't exist
      adminUser = new User({
        email,
        password: await bcrypt.hash(password, await bcrypt.genSalt(10)),
        fullname,
        role: ROLES.Admin
      });
      await adminUser.save();
      console.log(`${chalk.green('✓')} Admin user created.`);
    } else {
      console.log(`${chalk.yellow('!')} Admin user already exists. Skipping admin user creation.`);
    }

    // Seed categories if none exist
    let categories = await Category.find();
    if (categories.length === 0) {
      categories = await seedCategories();
      console.log(`${chalk.green('✓')} Categories seeded.`);
    } else {
      console.log(`${chalk.yellow('!')} Categories already exist. Skipping category seeding.`);
    }

    // Seed brands if none exist
    let brands = await Brand.find();
    if (brands.length === 0) {
      brands = await seedBrands();
      console.log(`${chalk.green('✓')} Brands seeded.`);
    } else {
      console.log(`${chalk.yellow('!')} Brands already exist. Skipping brand seeding.`);
    }

    // Seed users only if no non-admin users exist
    const usersCount = await User.countDocuments({ role: { $ne: ROLES.Admin } });
    if (usersCount === 0) {
      await seedUsers();
      console.log(`${chalk.green('✓')} Users seeded.`);
    } else {
      console.log(`${chalk.yellow('!')} Users already exist. Skipping user seeding.`);
    }

    // Seed products only if no products exist
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
      await seedProducts(categories, brands);
      console.log(`${chalk.green('✓')} Products seeded.`);
    } else {
      console.log(`${chalk.yellow('!')} Products already exist. Skipping product seeding.`);
    }

    console.log(`${chalk.green('✓')} ${chalk.green('Database seeding process completed successfully.')}`);
  } catch (error) {
    console.error(chalk.red('Seeding error:'), error);
    throw error;
  }
};

(async () => {
  try {
    const args = process.argv.slice(2);
    const email = args[0] || DEFAULT_ADMIN_EMAIL;
    const password = args[1] || DEFAULT_ADMIN_PASSWORD;
    const fullname = args[2] || DEFAULT_ADMIN_FULLNAME;

    await setupDB();
    await seedDB(email, password, fullname);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();