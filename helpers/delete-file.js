const fs = require("fs");
exports.deleteFile = (filePath) => {
  fs.unlink(filePath, (error) => console.log(error));
};
