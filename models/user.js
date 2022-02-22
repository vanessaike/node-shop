const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        product: {type: Schema.Types.ObjectId, ref: "Product", required: true},
        quantity: {type: Number, required: true},
      },
    ],
    total: Number,
  },
  resetToken: String,
  tokenExpiration: Date,
});

userSchema.methods.addToCart = function (product) {
  let newQuantity = 1;
  let newTotal;
  const cartItems = [...this.cart.items];

  // find the product index in the cart
  const productIndex = this.cart.items.findIndex((cartProduct) => cartProduct.product.toString() === product._id.toString());

  if (productIndex >= 0) {
    // if we have a product, we increase the quantity
    newQuantity = this.cart.items[productIndex].quantity + 1;
    // setting the quantity
    cartItems[productIndex].quantity = newQuantity;
    // increasing the cart total
    newTotal = this.cart.total + product.price;
  } else {
    // if we don't have a product we push it to the array
    cartItems.push({
      product: product._id,
      quantity: newQuantity,
    });

    // increase the cart total
    newTotal = this.cart.total + product.price;
  }

  // updating the whole cart
  const updatedCart = {
    items: cartItems,
    total: newTotal,
  };

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (product) {
  const deletedCartItem = this.cart.items.find((item) => item.product.toString() === product._id.toString());
  const updatedCartItems = this.cart.items.filter((item) => item.product.toString() !== product._id.toString());
  const updatedTotal = this.cart.total - product.price * deletedCartItem.quantity;

  const updatedCart = {
    items: updatedCartItems,
    total: updatedTotal,
  };

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.resetCart = function () {
  this.cart = {
    items: [],
    total: 0,
  };

  return this.save();
};

module.exports = mongoose.model("User", userSchema);
