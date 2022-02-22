const express = require("express");
const router = express.Router();

const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

router.get("/products", shopController.getAllProducts);
router.get("/cart", isAuth, shopController.getCart);
router.post("/post-cart", shopController.postCart);
router.post("/delete-cart-item", shopController.deleteCartItem);
router.get("/orders", isAuth, shopController.getOrders);
router.post("/search/", shopController.postSearchedProduct);
router.get("/checkout", isAuth, shopController.getCheckout);
router.get("/checkout/success", isAuth, shopController.checkoutSuccess);
router.get("/checkout/cancel", isAuth, shopController.getCheckout);
router.get("/product/:productId", shopController.getDetails);
router.get("/orders/:orderId", shopController.getInvoice);
router.get("/", shopController.getIndex);

module.exports = router;
