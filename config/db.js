const mongoose = require("mongoose");
const config = require("./config.json");

const MONGOURI = config.mongo;

const InitMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to database");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitMongoServer;