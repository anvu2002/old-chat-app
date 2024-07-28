const mongoose = require('mongoose');
const Message = require('./models/Message');

class MessageStore {
    constructor() {
        mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => console.log('[MessageStore] Connected to MongoDB'))
            .catch(err => console.error(' [MessageStore]  Failed to connect to MongoDB', err));
    }

    async saveMessage({ content, from, to }) {
        try {
            await Message.create({ content, from, to });
        } catch (error) {
            console.error('Failed to save message', error);
        }
    }

    async findMessagesForUser(userID) {
        try {
            return await Message.find({ $or: [{ from: userID }, { to: userID }] }).exec();
        } catch (error) {
            console.error('Failed to find messages', error);
            return [];
        }
    }
}

module.exports = MessageStore;
