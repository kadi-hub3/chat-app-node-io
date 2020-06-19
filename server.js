const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeft, roomUsers } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);
// set static folder
app.use(express.static(path.join(__dirname, 'public')));


const botname = 'ChatCord Bot';

// run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //welcome current user
        socket.emit('message', formatMessage(botname, 'Welcome to ChatCord!'));

        //broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botname, `${user.username} has joined the chat`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: roomUsers(user.room)
        });
    });
    //listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    //runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeft(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));
            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: roomUsers(user.room)
            });
        }
    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
