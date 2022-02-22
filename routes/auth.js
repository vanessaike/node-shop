const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");

// INPUT VALIDATION
const User = require("../models/user");
const {body} = require("express-validator");
//prettier-ignore
const validateSignUp = [
  body("name").trim(), 
  body("email", "Invalid email format.").isEmail().normalizeEmail().custom((value) => {
    return User.findOne({email: value})
    .then(user => {
      if (user) {
        return Promise.reject('Email already being used. Please, pick another one.')
      }
    })
  }), 
  body("password", "Please, enter a password that is at least 6 characters long.").isLength({min: 6}),
  body("confirmedPassword", "Passwords do not match.").custom((value, {req}) =>  {
    if (value !== req.body.password) {
      return false;
    }
    return true;
  })
];
//prettier-ignore
const validateLogin = [
  body('email', 'Invalid email format.').isEmail().normalizeEmail(),
  body('password', 'Invalid password.').isLength({min: 6})
];

const validateResetPassword = [body("email", "Invalid email format.").isEmail().normalizeEmail()];

const validateNewPassword = [body("password", "Please, enter a password that is at least 6 characters long.").isLength({min: 6})];

router.get("/sign-up", authController.getSignUp);
router.post("/sign-up", validateSignUp, authController.postSignUp);

router.get("/login", authController.getLogin);
router.post("/login", validateLogin, authController.postLogin);

router.post("/post-logout", authController.postLogout);

router.get("/reset-password", authController.getResetPassword);
router.post("/reset-password", validateResetPassword, authController.postResetPassword);

router.get("/reset/:token", authController.getNewPassword);
router.post("/new-password", validateNewPassword, authController.postNewPassword);

module.exports = router;
