const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");

const app = express();
const port = process.env.PORT || 5000;


//middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z2ynl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    client.connect();
    const serviceCollection = client
      .db("VolunteerService")
      .collection("services");
    const addService = client
      .db("UserAddedServices")
      .collection("user_services");
    const volunteersCollection = client
      .db("voluteer-list")
      .collection("volunteers");
    //verify jwt
    function VerifyJWT(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized acces" });
      }
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      });
    }
    //login with JWT
    app.post("/login", async (req, res) => {
      const user = req.body;
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
    //get all services
    app.get("/services", async (req, res) => {
      const q = req.query || {};
      const cursor = serviceCollection.find(q);
      const result = await cursor.toArray();
      res.send(result);
    });

    //get all registered volunteers
    app.get("/volunteers", VerifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = {};
        const cursor = volunteersCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      }
    });
    //add registeredVolunteer
    app.post("/addvolunteers", VerifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      const data = req.body;
      if (decodedEmail === email) {
        const result = await volunteersCollection.insertOne(data);
        res.send(result);
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    });
    //delete registered volunteers
    app.delete('/deleteregisteredvolunteer/:volunteerId',async(req, res)=>{
      const id = req.params.volunteerId;
      const query = {_id: ObjectId(id)};
      const result = await volunteersCollection.deleteOne(query);
      res.send(result)
    })
    //delete volunteer
    app.delete("/volunteer/:volunteerId", async (req, res) => {
      const id = req.params.volunteerId;
      const query = { _id: ObjectId(id) };
      const deleted = await volunteersCollection.deleteOne(query);
      res.send(deleted);
    });

    //add service
    app.post("/service", VerifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.body.email;
      if (decodedEmail === email) {
        const service = req.body;
        const result = await addService.insertOne(service);
        res.send(result);
      }
    });
    //get added services
    app.get("/addedServices", VerifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = addService.find(query);
        const events = await cursor.toArray();
        res.send(events);
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    });
    //delete service
    app.delete("/service/:serviceId", async (req, res) => {
      const id = req.params.serviceId;
      const query = { _id: ObjectId(id) };
      const deleted = await addService.deleteOne(query);
      res.send(deleted);
    });
    //get single service
    app.get("/service/:serviceId", async (req, res) => {
      const id = req.params.serviceId;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
  } finally {

  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running My Node Volunteer Network Server...");
});

app.listen(port, () => {
  console.log("Server is running at PORT: ", port);
});
