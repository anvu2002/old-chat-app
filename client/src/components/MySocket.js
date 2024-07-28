import { io } from 'socket.io-client';

class MySocket {
  constructor() {
    this.URL = 'http://localhost:3001';
    this.socket = io(this.URL, { autoConnect: false });
    this.users = [];
    this.selectedUser = null;
    this.onDataChange = (users) => {};

    this.socket.onAny((event, ...args) => {
      console.log(event, args);
    });
    this.socket.on("connect_error", (err) => {
      if (err.message === "invalid username") {
        console.log("++++++++++++++", err);
      }
    });
    this.socket.on("users", (users) => {
      users.forEach((user) => {
        user.self = user.userID === this.socket.userID;
      });
      this.users = users;
      this.onDataChange(this.users);
    });
    this.socket.on("user connected", (userData) => {
      let isUserAlreadyExist = false;
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.userID === userData.userID) {
          user.connected = true;
          isUserAlreadyExist = true;
          break;
        }
      }
      if (!isUserAlreadyExist) {
        this.users.push(userData);
      }
      this.onDataChange(this.users);
    });
    this.socket.on("private message", ({ content, from }) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (!user.messages) {
          user.messages = [];
        }
        if (user.userID === from) {
          user.messages.push({
            content,
            fromSelf: false,
          });
          if (user !== this.selectedUser) {
            user.hasNewMessages = true;
          }
          break;
        }
      }
      this.onDataChange(this.users);
    });
    this.socket.on("connect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      });
    });

    this.socket.on("user disconnected", (userID) => {
      this.users.forEach((user) => {
        if (user.userID === userID) {
          user.connected = false;
        }
      });
      this.onDataChange(this.users);
    });
    this.socket.on("session", ({ sessionID, userID }) => {
      this.socket.auth = { sessionID };
      sessionStorage.setItem("sessionID", sessionID);
      this.socket.userID = userID;
    });
  }

  onUsernameSelection(username) {
    this.socket.auth = { username };
    this.socket.connect();
  }

  setUserDataChange(callback) {
    this.onDataChange = callback;
  }

  setSelectedUser(userID) {
    const user = this.users.find((user) => user.userID === userID);
    this.selectedUser = user;
  }

  onMessage(content) {
    if (this.selectedUser) {
      this.socket.emit("private message", {
        content,
        to: this.selectedUser.userID,
        from: this.socket.userID,
      });
      if (this.selectedUser && !this.selectedUser.messages) {
        this.selectedUser.messages = [];
      }
      this.selectedUser.messages.push({
        content,
        fromSelf: true,
      });
    }
  }

  connectToSocket(sessionID) {
    this.socket.auth = { sessionID };
    this.socket.connect();
  }
}

export default MySocket;
