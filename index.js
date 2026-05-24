const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const port = process.env.PORT;

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

const JWKS = createRemoteJWKSet(new URL(`http://localhost:3000/api/auth/jwks`));

// ! token verifier function and get the owner or user

const verifyToken = async (req, res, next) => {
  const authHeather = req?.headers.authorization;
  if (!authHeather) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  const token = authHeather.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    // console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    await client.connect();

    //! DataBase and Database Collections are here

    const db = client.db("studynook");
    const roomCollection = db.collection("rooms");
    const bookingCollection = db.collection("bookings");
    const userProfileCollection = db.collection("userProfiles");

    //! Every single api for rooms add,get to show in the ui, see dynamic details page

    app.get("/room", async (req, res) => {
      const { search, amenities, minRate, maxRate, floor } = req.query;

      const filter = {};

      if (search) {
        filter.roomName = { $regex: search, $options: "i" };
      }

      if (amenities) {
        const amenityList = amenities.split(",");
        filter.amenities = { $in: amenityList };
      }

      if (minRate || maxRate) {
        filter.hourlyRate = {};
        if (minRate) filter.hourlyRate.$gte = Number(minRate);
        if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
      }

      if (floor) {
        filter.floor = Number(floor);
      }

      const result = await roomCollection.find(filter).toArray();
      res.json(result);
    });

    app.post("/room", verifyToken, async (req, res) => {
      const roomData = req.body;

      const finalRoom = {
        ...roomData,
        ownerUserId: req.user.sub,
        ownerEmail: req.user.email,
        bookingCount: 0,
        createdAt: new Date(),
      };

      // console.log(roomData);
      // const result = await roomCollection.insertOne(roomData);

      const result = await roomCollection.insertOne(finalRoom);

      res.json(result);
    });

    app.get("/room/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await roomCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(result);
    });

    // PUT Operation for editing added room

    app.put("/room/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const room = await roomCollection.findOne({ _id: new ObjectId(id) });
      if (!room) return res.status(404).json({ message: "Room not found." });

      if (room.ownerUserId !== req.user.sub) {
        return res
          .status(403)
          .json({ message: "Forbidden. You don't own this room." });
      }

      const {
        ownerUserId,
        ownerEmail,
        bookingCount,
        createdAt,
        ...updatableFields
      } = req.body;

      await roomCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updatableFields, updatedAt: new Date() } },
      );

      res.json({ message: "Room updated successfully!" });
    });

    // Delete operation to delete added room

    app.delete("/room/:id", verifyToken, async (req, res) => {
      const { id } = req.params;

      const room = await roomCollection.findOne({ _id: new ObjectId(id) });
      if (!room) return res.status(404).json({ message: "Room not found." });

      if (room.ownerUserId !== req.user.sub) {
        return res
          .status(403)
          .json({ message: "Forbidden. You don't own this room." });
      }

      await roomCollection.deleteOne({ _id: new ObjectId(id) });
      await bookingCollection.deleteMany({ roomId: id });

      res.json({ message: "Room deleted successfully!" });
    });

    //! Every single Operations for Booking ,checking owner and detect conflict and show bookings in ui

    //? POST Operation for /bookings and Conflict validation

    app.post("/bookings", verifyToken, async (req, res) => {
      const {
        roomId,
        roomName,
        roomImage,
        bookingDate,
        startTime,
        endTime,
        totalHours,
        totalCost,
        specialNote,
      } = req.body;

      const today = new Date().toISOString().split("T")[0];
      if (bookingDate < today) {
        return res
          .status(400)
          .json({ message: "Booking date cannot be in the past." });
      }
      if (endTime <= startTime) {
        return res
          .status(400)
          .json({ message: "End time must be after start time." });
      }

      const conflict = await bookingCollection.findOne({
        roomId,
        bookingDate,
        status: "confirmed",
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      });

      if (conflict) {
        return res.status(409).json({
          message: `Room already booked from ${conflict.startTime}–${conflict.endTime} on ${bookingDate}.`,
        });
      }

      const booking = {
        roomId,
        roomName,
        roomImage,
        bookingDate,
        startTime,
        endTime,
        totalHours,
        totalCost,
        specialNote: specialNote || "",
        userId: req.user.sub,
        userEmail: req.user.email,
        status: "confirmed",
        createdAt: new Date(),
      };

      const result = await bookingCollection.insertOne(booking);

      await roomCollection.updateOne(
        { _id: new ObjectId(roomId) },
        { $inc: { bookingCount: 1 } },
      );

      await userProfileCollection.updateOne(
        { userId: req.user.sub },
        { $push: { bookings: result.insertedId } },
        { upsert: true },
      );

      res.status(201).json({ message: "Room booked successfully!", result });
    });

    // for booking card

    app.get("/bookings", verifyToken, async (req, res) => {
      const userId = req.user.sub;
      const result = await bookingCollection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    // for canceling booking

    app.patch("/bookings/:id/cancel", verifyToken, async (req, res) => {
      const { id } = req.params;
      const userId = req.user.sub;

      const booking = await bookingCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
      }
      if (booking.userId !== userId) {
        return res
          .status(403)
          .json({ message: "Forbidden. This is not your booking." });
      }
      if (booking.status === "cancelled") {
        return res
          .status(400)
          .json({ message: "Booking is already cancelled." });
      }

      await bookingCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "cancelled" } },
      );

      await roomCollection.updateOne(
        { _id: new ObjectId(booking.roomId) },
        { $inc: { bookingCount: -1 } },
      );

      await userProfileCollection.updateOne(
        { userId },
        { $pull: { bookings: new ObjectId(id) } },
      );

      res.json({ message: "Booking cancelled successfully." });
    });

    //! For homepage featured section

    app.get("/featured", async (req, res) => {
      try {
        const result = await roomCollection
          .find()
          .sort({ _id: -1 })
          .limit(6)
          .toArray();

        res.status(200).json(result);
      } catch (error) {
        console.error(error);

        res.status(500).json({
          message: "Failed to fetch featured rooms",
        });
      }
    });

    //! for room listing

    app.get("/my-listings", verifyToken, async (req, res) => {
      const ownerUserId = req.user.sub;
      const result = await roomCollection
        .find({ ownerUserId })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(result);
    });

    //

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
  res.send("Server is running On Fire !!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
