exports.get404 = (req, res) => {
  res.status(404).render("error/error404", {
    pageTitle: "Page not Found",
    path: "/404",
  });
};

exports.get500 = (req, res) => {
  res.status(500).render("error/error500", {
    pageTitle: "Database error",
    path: "/500",
  });
};
