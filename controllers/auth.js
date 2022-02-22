const User = require("../models/user");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");

const {validationResult} = require("express-validator");

const {errorHandling} = require("../helpers/error-handling");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: `${process.env.SENDGRID_KEY}`,
    },
  })
);

exports.getLogin = (req, res) => {
  let message = req.flash("error");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    pageTitle: "Login",
    path: "/login",
    errorMessage: message,
    hasError: false,
    errors: [],
  });
};

exports.getSignUp = (req, res) => {
  let message = req.flash("error");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/sign-up", {
    pageTitle: "Sign up",
    path: "",
    errorMessage: message,
    hasError: false,
    errors: [],
  });
};

exports.postSignUp = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmedPassword = req.body.confirmedPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/sign-up", {
      pageTitle: "Sign up",
      path: "",
      errorMessage: errors.array()[0].msg,
      hasError: true,
      oldInput: {
        name: name,
        email: email,
        password: password,
        confirmedPassword: confirmedPassword,
      },
      errors: errors.array(),
    });
  }

  bcrypt.hash(password, 12).then((encryptedPassword) => {
    const user = new User({
      name: name,
      email: email,
      password: encryptedPassword,
      cart: {items: [], total: 0},
    });

    return user
      .save()
      .then(() => {
        res.redirect("/login");
        return transporter.sendMail({
          to: email,
          from: "nodeshop.email@gmail.com",
          subject: "Sign up successful!",
          html: `
              <h1>${name}, thank you for joining us!</h1>
              <p>Enjoy our platform!</p>
            `,
        });
      })
      .catch((error) => errorHandling(error, next));
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(402).render("auth/login", {
      pageTitle: "Login",
      path: "/login",
      hasError: true,
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      },
      errors: errors.array(),
    });
  }

  User.findOne({email: email})
    .then((user) => {
      if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/login");
      }

      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            // we're loggedin
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save(() => res.redirect("/"));
          } else {
            req.flash("error", "User not found.");
            return res.redirect("/login");
          }
        })
        .catch((error) => console.log(error));
    })
    .catch((error) => errorHandling(error, next));
};

exports.postLogout = (req, res) => {
  req.session.destroy((error) => {
    console.log(error);
    res.redirect("/");
  });
};

exports.getResetPassword = (req, res) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset-password", {
    pageTitle: "Reset password",
    path: "",
    errorMessage: message,
    hasError: false,
    errors: [],
  });
};

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  let fetchedUser;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset-password", {
      pageTitle: "Reset password",
      path: "",
      errorMessage: errors.array()[0].msg,
      oldInput: email,
      hasError: true,
      errors: errors.array(),
    });
  }

  crypto.randomBytes(32, (error, buffer) => {
    const token = buffer.toString("hex");

    User.findOne({email: email})
      .then((user) => {
        if (!user) {
          req.flash("error", "Could not find user.");
          return res.redirect("/reset-password");
        }

        fetchedUser = user;
        user.resetToken = token;
        user.tokenExpiration = Date.now() + 3600000; // 1 hour from now
        return user.save();
      })
      .then(() => {
        res.redirect("/login");
        // seding email
        transporter.sendMail({
          to: email,
          from: "nodeshop.email@gmail.com",
          subject: "Password reset",
          html: `
            <h1>${fetchedUser.name}, you requested a password reset.</h1>
            <p>Click <a href="http://localhost:3000/reset/${token}">this link</a> to define your new password.</p>
            <p>In case you're redirected to another page, that means your token has expired. Please, repeat the process to reset your password.</p>
          `,
        });
      })
      .catch((error) => errorHandling(error, next));
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  User.findOne({resetToken: token, tokenExpiration: {$gt: Date.now()}})
    .then((user) => {
      if (!user) {
        return res.redirect("/reset-password");
      }

      res.render("auth/new-password", {
        pageTitle: "Enter new password",
        path: "",
        errorMessage: null,
        token: token,
        userId: user._id,
        errors: [],
      });
    })
    .catch((error) => errorHandling(error, next));
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const token = req.body.token;
  let fetchedUser;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/new-password", {
      pageTitle: "Enter new password",
      path: "",
      errorMessage: errors.array()[0].msg,
      token: token,
      userId: userId,
      errors: errors.array(),
    });
  }

  User.findOne({resetToken: token, tokenExpiration: {$gt: Date.now()}, _id: userId})
    .then((user) => {
      fetchedUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((encryptedPassword) => {
      fetchedUser.password = encryptedPassword;
      fetchedUser.token = undefined;
      fetchedUser.tokenExpiration = undefined;
      return fetchedUser.save();
    })
    .then(() => res.redirect("/login"))
    .catch((error) => errorHandling(error, next));
};
