const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect("mongodb+srv://vanessa:vn2070@cluster0.mb1bs.mongodb.net/nodeShop?retryWrites=true&w=majority")
    .then((client) => {
      _db = client.db();
      callback();
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found.";
};

exports.mongoConnnect = mongoConnect;
exports.getDb = getDb;
