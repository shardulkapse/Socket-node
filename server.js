const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoConnectHandler = require("./utils/mongodb");

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/signin", (req, res) => {
  (async () => {
    const client = await mongoConnectHandler();
    try {
      const exisDoc = await client
        .db("socket")
        .collection("users")
        .findOne({ email: req.body.email });
      if (exisDoc) {
        return res.status(500).send({ message: "Email already in user." });
      } else {
        const result = await client.db("socket").collection("users").insertOne({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
        });
        return res.status(200).send({
          _id: result.insertedId,
          email: req.body.email,
          name: req.body.name,
        });
      }
    } catch (err) {
      return res.status(500).send(500);
    } finally {
      await client.close();
    }
  })();
});

app.post("/login", (req, res) => {
  (async () => {
    const client = await mongoConnectHandler();
    try {
      const exisDoc = await client
        .db("socket")
        .collection("users")
        .findOne({ email: req.body.email, password: req.body.password });
      if (exisDoc) {
        return res
          .status(200)
          .send({ _id: exisDoc._id, email: exisDoc.email, name: exisDoc.name });
      } else {
        return res.status(500).send({ message: "Invalid Credentials" });
      }
    } catch (err) {
      return res.status(500).send(500);
    } finally {
      await client.close();
    }
  })();
});

app.post("/addMsg", (req, res) => {
  (async () => {
    const client = await mongoConnectHandler();
    try {
      const result = await client.db("socket").collection("chats").insertOne({
        text: req.body.text,
        senderId: req.body.senderId,
        senderName: req.body.senderName,
        time: new Date(),
      });
      return res.status(200).send({ insertedId: result.insertedId });
    } catch (err) {
      return res.status(500).send(500);
    } finally {
      await client.close();
    }
  })();
});

app.get("/getMsg", (req, res) => {
  (async () => {
    const client = await mongoConnectHandler();
    try {
      const docs = client
        .db("socket")
        .collection("chats")
        .find({})
        .sort({ time: 1 });
      const result = await docs.toArray();
      return res.status(200).send(result);
    } catch (err) {
      return res.status(500).send(err);
    } finally {
      await client.close();
    }
  })();
});

const server = app.listen(PORT, (err) => {
  if (!err) {
    console.log(`Server is running ${PORT}`);
  } else {
    console.log(err);
  }
});

let users = [];

const addUserHandler = (uid, sid) => {
  !users.some((user) => user.uid === uid) && users.push({ uid, sid });
};

const removerUserHandler = (sid) => {
  users = users.filter((user) => user.sid !== sid);
};

const io = require("socket.io")(server, {
  cors: {
    origin: "https://socket-lemon.vercel.app/",
  },
});

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("addUser", (userId) => {
    addUserHandler(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", ({ senderId, name, text, msgId }) => {
    io.emit("getMessage", {
      senderId: senderId,
      text: text,
      senderName: name,
      time: new Date(),
      _id: msgId,
    });
  });

  socket.on("disconnect", () => {
    console.log("user dc");
    removerUserHandler(socket.id);
    io.emit("getUsers", users);
  });
});
