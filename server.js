const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);
// globals
const PORT = process.env.PORT || 3000;
const botName = 'Cirtain-Days bot';
// utils
const format_socket_message = require('./utils/messages');
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./utils/users');

// serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// // intercept root route to inject key press event listener/websocket client
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));

//   // Inject JavaScript into index.html
//   const injectedScript = `
//       <script>
//           document.addEventListener('keydown', (event) => {
//               const allowedKeys = ['a', 'd']; // Add more keys as needed
//               if (allowedKeys.includes(event.key)) {
//                   socket.emit('keyPress', event.key);
//               }
//           });
//       </script>
//   `;
//   res.write(injectedScript);
//   res.end();
// });

/*
  .
  .
  ========= 1. Client 'CONNECTION' Event (connected to port) ============
  RECEIVED
  .
  .
*/
io.on('connection', (socket) => {
  /*
  .
  .
  2. 'JOINROOM' Event (userName and roomName received from frontend)
  RECEIVED
  .
  .
  */
  socket.on('Join Room', ({ username, room }) => {
    /*
    .
    .
    3. Push user in array (temporary db) with custom userJoin function
    .
    .
    */
    const user = userJoin(socket.id, username, room);

    /*
    .
    .
    4. Join user to paritular room (as selected by user in index page)
    .
    .
    */
    socket.join(user.room);

    /*
    .
    .
    5. Greet current user under 'MESSAGE' event with custom formatMessage function
    SENT
    .
    .
    */
    socket.emit(
      'message',
      format_socket_message(
        botName,
        'Welcome to JustTalk! This is a chatting platform developed by Nikhil Sourav!'
      )
    );

    /*
    .
    .
    5. Notify everyone (except current user) that a new user is connected. Under 'MESSAGE' event
    SENT
    .
    .
    */
    socket.broadcast
      .to(user.room)
      .emit('message', format_socket_message(botName, `${user.username} has joined the chat`));

    /*
    .
    .
    6. Send current room and list of all users in this particular room under 'ROOMUSERS' event
    SENT
    .
    .
    */
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    /*
    .
    .
    6. Receive message typed by user under 'CHATMESSAGE' event (msg is string)
    RECEIVED
    7. Send this message under 'MESSAGE' event to broadcast to everyone in this room
    SEND
    .
    .
    */
    socket.on('chatMessage', (msg) => {
      const user = getCurrentUser(socket.id);
      io.to(user.room).emit('message', format_socket_message(user.username, msg));
    });

    /*
    .
    .
    8. If connection by user is broken (user leaves), delete this user from db
    9. Send 'USER LEFT' message under 'MESSAGE' event to broadcast to everyone in this room 
    .
    .
    */
    socket.on('disconnect', () => {
      // delete user from temporary db
      const user = userLeaves(socket.id);

      // Send message that user left
      if (user) {
        io.to(user.room).emit(
          'message',
          format_socket_message(botName, `${user.username} has left the chat`)
        );

        // Send users and room info to update
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });
  });

  // // kkey uncirtain-days
  // socket.on('keyPress', (key) => {
  //   if (key === 'a' || key === 'd') {
  //     console.log(key + ' key pressed');
  //     io.emit('keyPress', key); // Broadcast the key press to all clients
  //   }
  // });
});

// kkey uncirtain-days
io.on('connection', (socket) => {
  socket.on('keyPress', (key) => {
    if (key === 'a' || key === 'd') {
      console.log(key + ' key pressed');
      io.emit('keyPress', key); // Broadcast the key press to all clients
    }
  });
});

// fire up server
server.listen(PORT, () => console.log(`server up on port ${PORT}`));
