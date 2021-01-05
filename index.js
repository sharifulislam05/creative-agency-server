const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000;
require("dotenv").config();
const fileUpload = require("express-fileupload");
const ObjectID = require("mongodb").ObjectID;

const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wascw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("hello express connect");
});

client.connect((err) => {
  const orderCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("orders");
  const reviewCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("reviews");
  const serviceCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("services");
  const adminCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("admins");
  
  //post order from customer
  app.post("/addOrder", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const status = req.body.status;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    orderCollection
      .insertOne({ name, email, title, description, price, image, status })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });
  //order status update by admin
  app.patch("/orderStatus/:id", (req, res) => {
    const orderId = req.params.id;
    const currentStatus = req.body.status;
    orderCollection
      .updateOne(
        { _id: ObjectID(orderId) },
        { $set: { status: currentStatus } }
      )
      .then((result) => {
        res.send(result.modifiedCount > 0);
      });
  });
  //get orders data for customer
  app.get("/orders", (req, res) => {
    orderCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  //post review from customer
  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  //get all reviews for home page
  app.get("/reviews", (req, res) => {
    reviewCollection
      .find({})
      .sort({ _id: -1 })
      .limit(3)
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  //post add services by admin
  app.post("/addService", (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
    const image = {
      name: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    serviceCollection
      .insertOne({ title, description, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });
  //get service for home page
  app.get("/getServices", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //get service for selected service
  app.post("/service", (req, res) => {
    const id = req.body.serviceId;
    serviceCollection.find({ _id: ObjectID(id) }).toArray((err, documents) => {
      res.send(documents[0]);
    });
  });
  //get serviceList for admin
  app.get("/serviceList", (req, res) => {
    orderCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //post add admin
  app.post("/addAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.insertOne({ email }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  //get admin list
  app.post("/isAdmin", (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email }).toArray((err, admin) => {
      res.send(admin);
    });
  });
});

app.listen(process.env.PORT || port);
