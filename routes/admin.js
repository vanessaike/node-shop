const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

// INPUT VALIDATION
const {body} = require("express-validator");

//prettier-ignore
const validateProduct = [
  body('title', 'Please, enter a valid title.').trim().isLength({min: 1}),
  body('price', 'Please, enter a valid price.').isFloat(),
  body('description', 'Please, enter a valid description.').trim().isLength({min: 1})
]

router.get("/add-product", isAuth, adminController.getAddProduct);
router.post("/add-product", validateProduct, adminController.postAddProduct);

router.get("/products", isAuth, adminController.getProducts);

router.post("/edit-product", validateProduct, adminController.postEditProduct);

router.delete("/product/:productId", adminController.deleteProduct);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

module.exports = router;
