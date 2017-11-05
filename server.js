// 20171105 DM - server component for chatty app (Lighthouse Labs project).
// server.js

const express = require('express');
const SocketServer = require('ws').Server;

const uuidv4 = require('uuid/v4');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
    // Make the express server serve static assets (html, javascript, css) from the /public folder
    .use(express.static('public'))
    .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// Set global variable to keep track of the users online.
let arrUserList = [];

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
    // Print out the current total to the server then boardcast it to each user.
    console.log(`Client connected (${wss.clients.size} users)`);
    arrUserList.push('Anonymous');
    updateUserList();

    var WebSocket = require('ws')
    ws.on('message', function incoming(data) {
        let objMessage = JSON.parse(data);
        switch(objMessage.type){
            case 'message':
            case 'notification':
                // Remove the old username from the userlist.
                let oldIndex = arrUserList.indexOf(objMessage['username']);
                if (oldIndex > -1){
                    arrUserList.splice(oldIndex, 1);
                }
                arrUserList.push(objMessage['newName']);
                objMessage['userList'] = arrUserList;
                break;
            case 'update':
                break;
            default:

            throw new Error('unknown message type ' + objMessage.type);

        }

        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(objMessage));
        });
    });

    // Broadcast to all.
    ws.broadcast = function broadcast(data) {
        ws.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
            client.send(data);
            }
        });
    };

    // Set up a callback for when a client closes the socket. This usually means they closed their browser.
    ws.on('close', () => {
        console.log(`Client disconnected (${wss.clients.size} users)`);
        updateUserList();
    });
});

// Create a new message for the user list then broadcast the new total to all users.  
function updateUserList(){
    let oldIndex = arrUserList.indexOf('Anonymous');
    if (oldIndex === -1){
        arrUserList.push('Anonymous'); 
    }

    const newMessage = JSON.stringify({type: 'update', uuid: uuidv4(), username: 'Server Notification', totalUsers: wss.clients.size, userList: arrUserList});
    wss.clients.forEach(function each(client) {
        client.send(newMessage);
    }) 
}
