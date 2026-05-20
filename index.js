const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const cors = require("cors");

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("studynook");
    const roomCollection = db.collection("rooms");

    app.get("/room", async (req, res) => {
      const result = await roomCollection.find().toArray();
      res.json(result);
    });

    app.post("/room", async (req, res) => {
      const roomData = req.body;

      console.log(roomData);
      const result = await roomCollection.insertOne(roomData);
      res.json(result);
    });

    app.get("/room/:id", async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine !!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
