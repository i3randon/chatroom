var fs = require('fs'),
    path = require('path'),
    sio = require('socket.io'),
    escape = require('escape-html'),
    static = require('node-static');

var app = require('http').createServer(handler);
app.listen(8000);

var messages = [];

var file = new static.Server(path.join(__dirname, '..', 'public'));

function handler(req, res) {
    file.serve(req, res);
}

var io = sio.listen(app),
    nicknames = {};

io.sockets.on('connection', function (socket) {


    socket.on('user message', function (msg) {
        console.log(escape(msg));
        //var escape_msg = escape(msg);
        var data = {
            name: socket.nickname,
            type: 'user message',
            msg: msg
        };
        messages.push(data);
        console.log(messages);
        socket.broadcast.emit('user message', socket.nickname, msg);
    });

    socket.on('user image', function (msg) {
        console.log(msg);
        var data = {
            name: socket.nickname,
            type: 'user image',
            msg: msg
        };
        messages.push(data);
        socket.broadcast.emit('user image', socket.nickname, msg);
    });

    socket.on('nickname', function (nick, fn) {
        if (nicknames[nick]) {

            fn(true);
        }
        else {

            fn(false);
            nicknames[nick] = socket.nickname = nick;
            socket.broadcast.emit('announcement', nick + ' connected');

            // display previous 100 message for new join
            var start = 0;
            if (messages.length > 100)
                start = messages.length - 100;

            messages = messages.slice(start, messages.length);
            console.log(start, messages.length);
            io.sockets.emit('prev_message', nick, messages);

            io.sockets.emit('nicknames', nicknames);
        }
    });

    socket.on('disconnect', function () {

        if (!socket.nickname) {

            return;
        }

        delete nicknames[socket.nickname];
        socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
        socket.broadcast.emit('nicknames', nicknames);
    });
});
