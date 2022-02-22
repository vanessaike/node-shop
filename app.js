const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const https = require("https");

const session = require("express-session");
const mongoose = require("mongoose");
const MongDbStore = require("connect-mongodb-session")(session);
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.mb1bs.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const User = require("./models/user");

const app = express();

const csrfProtection = csrf();

// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "images"),
  filename: (req, file, cb) => cb(null, `${new Date().toISOString()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {flags: "a"});

// app.use(helmet());
app.use(compression());
// app.use(morgan("combined", {stream: accessLogStream}));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(bodyParser.urlencoded({extended: false}));
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);

// routes
const errorController = require("./controllers/error");
const shopRoutes = require("./routes/shop");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

// session
const store = new MongDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: `${process.env.SESSION_SECRET}`,
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(csrfProtection);

app.use(flash());

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  res.locals.productTitle = "";
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }

      req.user = user;
      next();
    })
    .catch((error) => {
      console.log(error);
      return next(new Error(error));
    });
});

app.use(shopRoutes);
app.use("/admin", adminRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).render("error/error500", {
    pageTitle: "Database error",
    path: "/500",
  });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000)
    app.listen(process.env.PORT || 3000);
  })
  .catch((error) => console.log(error));
