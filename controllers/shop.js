const Product = require("../models/product");
const Order = require("../models/order");
const PDF = require("pdfkit");
const path = require("path");
const fs = require("fs");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const {errorHandling} = require("../helpers/error-handling");
const ITEMS_PER_PAGE = require("../helpers/items-per-page");

exports.getIndex = (req, res, next) => {
  Product.find()
    .limit(3)
    .then((products) => {
      res.render("shop/index", {
        pageTitle: "nodeShop",
        path: "/",
        products: products,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.getAllProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalProducts = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/products", {
        pageTitle: "All products",
        path: "/products",
        products: products,
        hasNextPage: totalProducts > ITEMS_PER_PAGE * page,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.getDetails = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      res.render("shop/details", {
        pageTitle: product.title,
        path: "",
        product: product,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.postSearchedProduct = (req, res, next) => {
  const productTitle = req.body.productTitle.toLowerCase();
  Product.find({title: productTitle})
    .then((products) => {
      res.render("shop/search-results", {
        pageTitle: `Results for "${productTitle}"`,
        searchedProd: productTitle,
        path: "",
        products: products,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.product")
    .then((user) => {
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your cart",
        products: user.cart.items,
        cartTotal: user.cart.total.toFixed(2),
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then((product) => req.user.addToCart(product))
    .then(() => res.redirect("/cart"))
    .catch((error) => errorHandling(error, next));
};

exports.deleteCartItem = (req, res, next) => {
  const productId = req.body.productId;

  Product.findById(productId)
    .then((product) => {
      return req.user.removeFromCart(product);
    })
    .then(() => res.redirect("/cart"))
    .catch((error) => errorHandling(error, next));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total;
  req.user
    .populate("cart.items.product")
    .then((user) => {
      products = user.cart.items;
      total = user.cart.total;

      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((product) => {
          return {
            name: product.product.title,
            description: product.product.description,
            amount: product.product.price * 100,
            currency: "usd",
            quantity: product.quantity,
          };
        }),
        success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
        cancel_url: `${req.protocol}://${req.get("host")}/checkout/cancel`,
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "",
        pageTitle: "Checkout",
        products: products,
        total: total,
        sessionId: session.id,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.checkoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.product")
    .then((user) => {
      const products = user.cart.items;
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user._id,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => req.user.resetCart())
    .then(() => res.redirect("/orders"))
    .catch((error) => errorHandling(error, next));
};

exports.getOrders = (req, res, next) => {
  Order.find({"user.userId": req.user._id})
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Your orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      const invoiceName = `invoice-${order._id}.pdf`;
      const invoicePath = path.join("data", "invoices", invoiceName);

      // configuring the pdf file
      const pdfDoc = new PDF();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(16).text(`INVOICE - Order ${order._id}`);
      pdfDoc.text("-------------------------------");
      let total = 0;
      order.products.forEach((product) => {
        pdfDoc.fontSize(14).text(`${product.product.title} - $${product.product.price} (Quantity: ${product.quantity})`);
        total += product.product.price * product.quantity;
      });
      pdfDoc.text("-------------------------------");
      pdfDoc.fontSize(16).text(`Total: $${total}`, {underline: true});
      pdfDoc.end();
    })
    .catch((error) => errorHandling(error));
};
