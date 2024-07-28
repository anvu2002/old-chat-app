const { MongoClient } = require('mongodb');
require('dotenv').config();

class SessionStore {
    constructor() {
        this.client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        this.client.connect();
        this.db = this.client.db('linker');
        this.collection = this.db.collection('sessions');
    }

    async findSession(id) {
        return this.collection.findOne({ _id: id });
    }

    async saveSession(id, session) {
        return this.collection.updateOne({ _id: id }, { $set: session }, { upsert: true });
    }

    async findAllSessions() {
        return this.collection.find().toArray();
    }
}

module.exports = SessionStore;
