const Koa = require('koa');
const koaSend = require('koa-send');
const statics = require('koa-static');
const socket = require('socket.io');

const path = require('path');
const http = require('http');

const port = 3000;
const app = new Koa();


app.use(statics(
    path.join( __dirname,  './dist')
));
app.use(async (ctx, next) => {
    if (!/\./.test(ctx.request.url)) {
        await koaSend(
            ctx,
            'index.html',
            {
                root: path.join(__dirname, './'),
                maxage: 1000 * 60 * 60 * 24 * 7,
                gzip: true,
            }
        );
    } else {
        await next();
    }
});
const httpServer = http.createServer(app.callback()).listen(port, ()=>{
    console.log('httpServer app started at port ...' + port);
});
const options = {
    ioOptions: {
        pingTimeout: 10000,
        pingInterval: 5000,
    }
};
const httpIo = socket(httpServer, options);
const rooms = {};
const socks = {};
const httpConnectIoCallBack = (sock) => {
    console.log(`sockId:${sock.id}连接成功!!!`);
    sock.emit('connectionSuccess', sock.id);
    // 用户断开连接
    sock.on('userLeave', ({ userName, roomId, sockId} = user)=> {
        console.log(`userName:${userName}, roomId:${roomId}, sockId:${sockId} 断开了连接...`);
        if (roomId && rooms[roomId] && rooms[roomId].length) {
            rooms[roomId] = rooms[roomId].filter(item => item.sockId!==sockId);
            httpIo.in(roomId).emit('userLeave', rooms[roomId]);
            console.log(`userName:${userName}, roomId:${roomId}, sockId:${sockId} 离开了房间...`);
        }
    });
    // 用户加入房间
    sock.on('checkRoom', ({ userName, roomId, sockId})=> {
        rooms[roomId] = rooms[roomId] || [];
        sock.emit('checkRoomSuccess', rooms[roomId]);
        if (rooms[roomId].length > 1) return false;
        rooms[roomId].push({ userName, roomId, sockId});
        sock.join(roomId, () => {
            httpIo.in(roomId).emit('joinRoomSuccess', rooms[roomId]);
            socks[sockId] = sock;
            console.log(`userName:${userName}, roomId:${roomId}, sockId:${sockId} 成功加入房间!!!`);
        });
    });
    // 发送视频
    sock.on('toSendVideo', (user) => {
        httpIo.in(user.roomId).emit('receiveVideo', user);
    });
    // 取消发送视频
    sock.on('cancelSendVideo', (user) => {
        httpIo.in(user.roomId).emit('cancelSendVideo', user);
    });
     // 接收视频邀请
     sock.on('receiveVideo', (user) => {
        httpIo.in(user.roomId).emit('receiveVideo', user);
    });
    // 拒绝接收视频
    sock.on('rejectReceiveVideo', (user) => {
        httpIo.in(user.roomId).emit('rejectReceiveVideo', user);
    });
    // 接听视频
    sock.on('answerVideo', (user) => {
        httpIo.in(user.roomId).emit('answerVideo', user);
    });
    // 挂断视频
    sock.on('hangupVideo', (user) => {
        httpIo.in(user.roomId).emit('hangupVideo', user);
    });
    // addIceCandidate
    sock.on('addIceCandidate', (data) => {
        const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
        socks[toUser.sockId].emit('addIceCandidate', data.candidate);
    });
    sock.on('receiveOffer', (data) => {
        const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
        socks[toUser.sockId].emit('receiveOffer', data.offer);
    });
    sock.on('receiveAnsewer', (data) => {
        const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
        socks[toUser.sockId].emit('receiveAnsewer', data.answer);
    });
};
httpIo.on('connection', httpConnectIoCallBack);



