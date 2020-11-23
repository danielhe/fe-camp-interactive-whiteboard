import io from 'socket.io-client';
const host = 'localhost:3000';
const socket = io.connect(host);
export default socket;
