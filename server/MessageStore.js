const { MongoClient } = require('mongodb');
require('dotenv').config();

class MessageStore {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        this.client.connect();
        this.db = this.client.db('linker');
        this.collection = this.db.collection('messages');
    }

    async findMessagesForUser(userID) {
        return this.collection.find({ $or: [{ from: userID }, { to: userID }] }).toArray();
    }

    async saveMessage(message) {
        return this.collection.insertOne(message);
    }
}

module.exports = MessageStore;
