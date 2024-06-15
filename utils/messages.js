// obtain current time from moment library
const moment = require('moment');

// return an obj containing userName, txt(msg) and time
function format_socket_message(username, text) {
  return {
    username,
    text,
    time: moment().add(6, 'hours').subtract(30, 'minutes').format('hh:mm a'),
  };
}

// export
module.exports = format_socket_message;
