require('dotenv').config();

const { Server } = require('socket.io');
const { createServer } = require('http');
const SessionStore = require('./SessionStore');
const MessageStore = require('./MessageStore');
const { instrument } = require("@socket.io/admin-ui");

const messageStore = new MessageStore();
const sessionStore = new SessionStore();
const httpServer = createServer();

const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:3000', 'https://admin.socket.io'],
    }
});

instrument(io, {
    auth: false,
    mode: "development",
});

io.use(async (socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = await sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
        }
        return next();
    }
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error('invalid username'));
    }
    socket.username = username;
    socket.userID = require('crypto').randomBytes(8).toString('hex');
    socket.sessionID = require('crypto').randomBytes(8).toString('hex');
    await sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true
    });
    next();
});

io.on('connection', async (socket) => {
    const users = [];
    const messages = await messageStore.findMessagesForUser(socket.userID);
    const messageInfo = new Map();
    if (messages) {
        messages.forEach((message) => {
            const otherUser = message.from === socket.userID ? message.to : message.from;
            if (messageInfo.has(otherUser)) {
                messageInfo.get(otherUser).push({
                    ...message,
                    fromSelf: socket.userID === message.from
                });
            } else {
                const data = {
                    ...message,
                    fromSelf: socket.userID === message.from
                };
                messageInfo.set(otherUser, [data]);
            }
        });
    }
    const sessions = await sessionStore.findAllSessions();
    sessions.forEach((session) => {
        users.push({
            userID: session.userID,
            username: session.username,
            connected: session.connected,
            messages: messageInfo.get(session.userID) || [],
        });
    });
    socket.join(socket.userID);
    socket.emit("session", {
        sessionID: socket.sessionID,
        userID: socket.userID,
    });
    socket.emit('users', users);

    socket.broadcast.emit("user connected", {
        userID: socket.userID,
        username: socket.username,
        connected: true,
    });

    socket.on("private message", async ({ content, to }) => {
        socket.to(to).to(socket.userID).emit("private message", {
            content,
            from: socket.userID,
            to
        });
        await messageStore.saveMessage({
            content,
            from: socket.userID,
            to
        });
    });

    socket.on('disconnect', async () => {
        const matchingSockets = await io.in(socket.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
            socket.broadcast.emit('user disconnected', socket.userID);
            await sessionStore.saveSession(socket.sessionID, {
                userID: socket.userID,
                username: socket.username,
                connected: false,
            });
        }
    });
});

httpServer.listen(3001);
console.log("server started on 3001")
