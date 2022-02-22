const Product = require("../models/product");
const {validationResult} = require("express-validator");

const {errorHandling} = require("../helpers/error-handling");
const {deleteFile} = require("../helpers/delete-file");
// const ITEMS_PER_PAGE  = require('../helpers/items-per-page')

exports.getAddProduct = (req, res) => {
  res.render("admin/product-form", {
    pageTitle: "Add product",
    path: "/admin",
    editing: false,
    isLoggedIn: req.session.isLoggedIn,
    hasError: false,
    errorMessage: null,
    errors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title.toLowerCase();
  const image = req.file;
  const price = +req.body.price;
  const description = req.body.description;
  const userId = req.user._id;

  if (!image) {
    return res.status(422).render("admin/product-form", {
      pageTitle: "Add product",
      path: "/admin",
      editing: false,
      isLoggedIn: req.session.isLoggedIn,
      hasError: true,
      errorMessage: "Attached file is not an image.",
      product: {
        title: title,
        price: price,
        description: description,
      },
      errors: [],
    });
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/product-form", {
      pageTitle: "Add product",
      path: "/admin",
      editing: false,
      isLoggedIn: req.session.isLoggedIn,
      hasError: true,
      errorMessage: errors.array()[0].msg,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errors: errors.array(),
    });
  }

  const imageUrl = image.path;
  const product = new Product({
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: userId,
  });

  product
    .save()
    .then(() => res.redirect("/admin/products"))
    .catch((error) => errorHandling(error, next));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    .then((products) => {
      res.render("admin/products", {
        pageTitle: "All products",
        path: "/admin",
        products: products,
        isLoggedIn: req.session.isLoggedIn,
        userName: req.user.name,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.user._id;

  Product.findById(productId)
    .then((product) => {
      deleteFile(product.imageUrl);
      return Product.deleteOne({_id: productId, userId: userId});
    })
    .then(() => res.status(200).json({message: "Success"}))
    .catch((error) => errorHandling(error, next));
};

exports.getEditProduct = (req, res, next) => {
  const productId = req.params.productId;
  const editing = req.query.edit;
  Product.findById(productId)
    .then((product) => {
      res.render("admin/product-form", {
        pageTitle: "Edit product",
        path: "/admin",
        product: product,
        editing: editing,
        isLoggedIn: req.session.isLoggedIn,
        errorMessage: null,
        errors: [],
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title.toLowerCase();
  const updatedImageUrl = req.file;
  const updatedPrice = +req.body.price;
  const updatedDesc = req.body.description;
  const userId = req.user._id;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/product-form", {
      pageTitle: "Edit product",
      path: "/admin",
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: productId,
      },
      editing: true,
      isLoggedIn: req.session.isLoggedIn,
      errorMessage: errors.array()[0].msg,
      errors: errors.array(),
    });
  }

  Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== userId.toString()) {
        return res.redirect("/");
      }

      product.title = updatedTitle;
      if (updatedImageUrl) {
        deleteFile(product.imageUrl);
        product.imageUrl = updatedImageUrl.path;
      }
      product.price = updatedPrice;
      product.description = updatedDesc;

      return product.save();
    })
    .then(() => res.redirect("/admin/products"))
    .catch((error) => errorHandling(error, next));
};
