import express from 'express';
import mongoose from "mongoose";
import Messages from './app/models/dbMessages.js';
import Cors from 'cors';
import Pusher from 'pusher';
//App Config
const app = express();
const port = process.env.PORT || 9000;
const connection_url = "mongodb+srv://Ananya:Ananya123.@cluster0.qjyqa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const pusher = new Pusher({
    appId: "1273338",
    key: "8bc57a4fd00912cb2863",
    secret: "97ef23f9c58865585a78",
    cluster: "ap2",
    useTLS: true
});
//Middleware
app.use(express.json());
app.use(Cors());
//DB Config
mongoose
    .connect(connection_url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        //useCreateIndex: true,
    })
    .then(() => {
        console.log("Successfully connected to the database");
    })
    .catch((err) => {
        console.log("Could not connect to the database. Exiting now...", err);
        process.exit();
    });
//API Endpoints
app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));
app.post('/messages/new', (req, res) => {
    const dbMessage = req.body
    Messages.create(dbMessage, (err, data) => {
        if (err)
            res.status(500).send(err)
        else
            res.status(201).send(data)
    })
});

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
});

const db = mongoose.connection
db.once("open", () => {
    console.log("DB Connected")
    const msgCollection = db.collection("messagingmessages")
    const changeStream = msgCollection.watch()
    changeStream.on('change', change => {
        console.log(change)
        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument
            // messages => channel
            // inserted => event
            // Publish an event to your subscribed clients using the server code below 
            // and it will be received by any (and all) of the clients you have open, including this page.
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Error trigerring Pusher')
        }
    })
});
//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));