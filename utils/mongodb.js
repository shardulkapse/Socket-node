const { MongoClient } = require("mongodb");

module.exports = async function mongoConnectHandler() {
  const uri = `mongodb+srv://shardul:shardul345@cluster0.xj62v0q.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri);
  return client;
};
