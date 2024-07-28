const mongoose = require('mongoose');
const Session = require('./models/Session');

class SessionStore {
    constructor() {
        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log('[SessionStore] Connected to MongoDB'))
            .catch(err => console.error('[SessionStore] Failed to connect to MongoDB', err));
    }

    async saveSession(sessionID, { userID, username, connected }) {
        try {
            await Session.findOneAndUpdate(
                { sessionID },
                { userID, username, connected },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Failed to save session', error);
        }
    }

    async findSession(sessionID) {
        try {
            return await Session.findOne({ sessionID }).exec();
        } catch (error) {
            console.error('Failed to find session', error);
            return null;
        }
    }

    async findAllSessions() {
        try {
            return await Session.find().exec();
        } catch (error) {
            console.error('Failed to find all sessions', error);
            return [];
        }
    }
}

module.exports = SessionStore;
