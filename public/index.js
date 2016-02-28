var local_name;

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

// escape Html
function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

function asterisk(string) {
    if (string.match(/\*[A-z0-9]+\*/gi) == null) {
        return string;
    }

    var bolded = string.replace(/\*[A-z0-9]+\*/gi, function myFunction(x) {
        return x.bold();
    });
    bolded = bolded.replace(/\*/gi, "");
    return bolded;
}


function link_produce(string) {
    var regex = /\[(.*)\]\((.*)\)/, matches = regex.exec(string);
    console.log(matches);
    if (matches == null)
        return string;

    var link_replace = string.replace(/\[(.*)\]\((.*)\)/gi, '<a href="' + matches[2] + '" target="_blank">' + matches[1] + '</a>');
    return link_replace;
}

function simple_markdown(string) {
    var res_str = asterisk(string);
    return res_str = link_produce(res_str);
}

//
// socket.io code
//
var socket = io.connect();

socket.on('connect', function () {
    $('#chat').addClass('connected');
});

socket.on('announcement', function (msg) {
    $('#lines').append($('<p>').append($('<em>').text(msg)));
});

socket.on('nicknames', function (nicknames) {
    $('#nicknames').empty().append($('<span>Online: </span>'));
    for (var i in nicknames) {
        $('#nicknames').append($('<b>').text(nicknames[i]));
    }
});

socket.on('prev_message', function (nick, messages) {
    if (local_name == nick) {

        messages.forEach(function (data) {
            $('#lines').append($('<p>').append($('<b>').text(data.name), simple_markdown(data.msg)));
        });
    }

});

socket.on('user message', message);
socket.on('user image', image);
socket.on('reconnect', function () {
    $('#lines').remove();
    message('System', 'Reconnected to the server');
});

socket.on('reconnecting', function () {
    message('System', 'Attempting to re-connect to the server');
});

socket.on('error', function (e) {
    message('System', e ? e : 'A unknown error occurred');
});

function message(from, msg) {
    $('#lines').append($('<p>').append($('<b>').text(from), simple_markdown(msg)));
}

function image(from, base64Image) {
    $('#lines').append($('<p>').append($('<b>').text(from), '<img src="' + base64Image + '"/>'));
}

//
// dom manipulation code
//
$(function () {

    $('#text-send').attr("disabled", true);
    $('#imagefile').attr("disabled", true);

    $('#set-nickname').submit(function (ev) {
        local_name = $('#nick').val();

        $('#text-send').attr("disabled", false);
        $('#imagefile').attr("disabled", false);

        socket.emit('nickname', $('#nick').val(), function (set) {
            if (!set) {
                clear();
                return $('#chat').addClass('nickname-set');
            }
            $('#nickname-err').css('visibility', 'visible');
        });
        return false;
    });

    $('#send-message').submit(function () {
        message('me', $('#message').val());
        socket.emit('user message', $('#message').val());
        clear();
        $('#lines').get(0).scrollTop = 10000000;
        return false;
    });

    function clear() {
        $('#message').val('').focus();
    };

    $('#imagefile').bind('change', function (e) {
        var data = e.originalEvent.target.files[0];
        var reader = new FileReader();
        reader.onload = function (evt) {
            image('me', evt.target.result);
            socket.emit('user image', evt.target.result);
        };
        reader.readAsDataURL(data);

    });
});
