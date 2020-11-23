<template>
    <div class="m-room-wrapper">
      <div class="can-support-rtc" v-if="canSupportVideo">
        <div class="form-area" v-if="showFormArea">
            <el-form
                :model="roomForm"
                :rules="rules"
                ref="roomForm"
                label-width="100px"
                class="room-form"
            >
                <el-form-item label="房间ID" prop="roomId">
                    <el-input v-model.trim="roomForm.roomId" :disabled="!canClickBtn"></el-input>
                </el-form-item>
                <el-form-item label="姓名" prop="userName">
                    <el-input v-model.trim="roomForm.userName" :disabled="!canClickBtn"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="submitForm" :disabled="!canClickBtn">加入房间</el-button>
                    <el-button @click="resetForm">重置</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="list-area" v-if="!showFormArea">
            <h2>当前房间id: {{ roomForm.roomId }} </h2>
            <h2>在线人数: {{ roomUsers.length }} </h2>
            <el-card class="box-card">
                <div v-for="item in roomUsers" :key="item.sockId" class="item">
                    {{ item.userName }}
                </div>
            </el-card>
            <el-button type="primary" v-if="roomUsers.length > 1 && sockId" @click="toSendVideo">
                发起视频
            </el-button>
        </div>
      </div>
      <div v-else>
        <h1>当前域名的浏览器不支持WebRTC！</h1>
      </div>
    </div>
</template>

<script>
import socket from '../utils/socket.js';

export default {
  name: 'Room',
  created () {
    if (this.canSupportWebRTC()) {
      this.initSocketEvents();
      this.initVIDEO_VIEWSdk();
    }
  },
  data () {
    const validateRoomId = (rule, value, callback) => {
      const reg = /^\d{1,4}$/;
      if (!reg.test(value)) {
        return callback(new Error('房间ID只能为1-4位的数字'));
      }
      callback();
    };
    const validateName = (rule, value, callback) => {
      const reg = /^[\u4e00-\u9fa5a-zA-Z-z]{1,10}$/;
      if (!reg.test(value)) {
        return callback(new Error('请输入合法的姓名'));
      }
      callback();
    };
    return {
      showFormArea: true,
      roomForm: {
        roomId: '',
        userName: ''
      },
      rules: {
        roomId: [
          { required: true, message: '请输入房间ID', trigger: ['blur', 'change'] },
          { validator: validateRoomId, trigger: ['blur', 'change'] }
        ],
        userName: [
          { required: true, message: '请输入姓名', trigger: ['blur', 'change'] },
          { validator: validateName, trigger: ['blur', 'change'] }
        ],
      },
      canClickBtn: true,
      sockId: '',
      roomUsers: [],
      canSupportVideo: false,
      localStream: null,
      peer: null,
      peerConfigs: {
        // 本地测试无需打洞 如部署到公网 需填写coturn的配置
        // iceServers: [{
        //   urls: 'turn:xxx:3478',
        //   credential: 'xxx',
        //   username: 'xxx'
        // }],
      },
      offerOption: {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
      },
    };
  },
  computed: {
    user () {
      return Object.assign({}, { sockId: this.sockId }, this.roomForm);
    },
    receiveUser () {
      return this.roomUsers.find(item => item.sockId !== this.sockId);
    },
  },
  methods: {
    canSupportWebRTC () {
      if (typeof navigator.mediaDevices !== 'object') {
        this.$message.error('No navigator.mediaDevices');
        return false;
      }
      if (typeof navigator.mediaDevices.enumerateDevices !== 'function') {
        this.$message.error('No navigator.mediaDevices.enumerateDevices');
        return false;
      }
      if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
        this.$message.error('No navigator.mediaDevices.getUserMedia');
        return false;
      }
      this.canSupportVideo = true;
      this.getDevices();
      return true;
    },
    async getDevices () {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        VIDEO_VIEW.showDevicesNameByDevices(devices);
      } catch (error) {
        console.error(error);
        const msg = `getDevices error: ${error.name} : ${error.message}`;
        this.$message.error(msg);
      }
    },
    initSocketEvents () {
      window.onbeforeunload = () => {
        socket.emit('userLeave', {
          userName: this.roomForm.userName,
          sockId: this.sockId,
          roomId: this.roomForm.roomId,
        });
      };
      socket.on('connectionSuccess', (sockId) => {
        this.sockId = sockId;
        console.log('connectionSuccess client sockId:', sockId);
      });
      socket.on('checkRoomSuccess', (exsitRoomUsers) => {
        this.canClickBtn = true;
        if (exsitRoomUsers && exsitRoomUsers.length > 1) {
          this.$message.info('当前房间人数已满~请换个房间id');
        } else {
          this.showFormArea = false;
          this.roomUsers = [
            {
              userName: this.roomForm.userName + '(我)',
              sockId: this.sockId,
              roomId: this.roomForm.roomId,

            }
          ];
        }
      });
      socket.on('joinRoomSuccess', (roomUsers) => {
        console.log('joinRoomSuccess client user:', roomUsers);
        const otherUser = roomUsers.find(item => item.sockId !== this.sockId);
        if (!otherUser) return false;
        this.$message.success(`${otherUser.userName}加入了房间`);
        this.roomUsers = [otherUser, {
          userName: this.roomForm.userName + '(我)',
          sockId: this.sockId,
          roomId: this.roomForm.roomId,

        }];
      });
      socket.on('userLeave', (roomUsers) => {
        console.log('userLeave client user:', roomUsers);
        if (!roomUsers.length) {
          this.showFormArea = true;
          this.sockId = '';
        }
        const serverSockIdArr = roomUsers.map(item => item.sockId);
        this.roomUsers.forEach(item => {
          if (serverSockIdArr.indexOf(item.sockId) === -1) {
            this.$message.info(`${item.userName}离开了房间`);
            if (item.sockId === this.sockId) {
              this.showFormArea = true;
              this.sockId = '';
            }
          }
        });
        this.roomUsers = roomUsers;
        this.roomUsers.forEach((item) => {
          if (item.sockId === this.sockId) {
            item.userName = item.userName + '(我)';
          }
        });
        // TODO: 挂断视频
        VIDEO_VIEW.hideAllVideoModal();
      });
      socket.on('disconnect', (message) => {
        this.showFormArea = true;
        this.sockId = '';
        console.log('client sock disconnect:', message);
        socket.emit('userLeave', this.user);
        // TODO: 挂断视频
        VIDEO_VIEW.hideAllVideoModal();
      });
      // 视频相关

      // 取消发送视频
      socket.on('cancelSendVideo', (user) => {
        const infoTips = user.sockId === this.sockId ? '您取消了发送视频' : '对方取消了发送视频';
        this.$message.info(infoTips);
        VIDEO_VIEW.hideAllVideoModal();
      });
      // 接收视频邀请
      socket.on('receiveVideo', (sender) => {
        if (this.user.sockId === sender.sockId) return false;
        VIDEO_VIEW.showReceiveVideoModalBySender(sender);
      });
      // 拒绝接收视频
      socket.on('rejectReceiveVideo', (user) => {
        const infoTips = user.sockId === this.sockId ? '您拒绝了接收视频' : '对方拒绝了接收视频';
        this.$message.info(infoTips);
        VIDEO_VIEW.hideAllVideoModal();
      });
      // 接听视频
      socket.on('answerVideo', async (user) => {
        VIDEO_VIEW.showInvideoModal();
        // 创建本地视频流信息
        const localStream = await this.createLocalVideoStream();
        this.localStream = localStream;
        document.querySelector('#echat-local').srcObject = this.localStream;
        this.peer = new RTCPeerConnection();
        console.log(this.peer);
        this.initPeerListen();
        this.peer.addStream(this.localStream);
        if (user.sockId === this.sockId) {
          // 接收方
        } else {
          // 发送方 创建offer
          const offer = await this.peer.createOffer(this.offerOption);
          await this.peer.setLocalDescription(offer);
          socket.emit('receiveOffer', { user: this.user, offer });
        }
      });
      // 挂断视频
      socket.on('hangupVideo', (user) => {
        const infoTips = user.sockId === this.sockId ? '您挂断了视频' : '对方挂断了视频';
        this.$message.info(infoTips);
        this.peer.close();
        this.peer = null;
        VIDEO_VIEW.hideAllVideoModal();
        document.querySelector('#echat-remote-1').srcObject = null;
        document.querySelector('#echat-local').srcObject = null;
      });
      //
      socket.on('addIceCandidate', async (candidate) => {
        await this.peer.addIceCandidate(candidate);
      });
      socket.on('receiveOffer', async (offer) => {
        await this.peer.setRemoteDescription(offer);
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        socket.emit('receiveAnsewer', { answer, user: this.user });
      });
      socket.on('receiveAnsewer', (answer) => {
        this.peer.setRemoteDescription(answer);
      });
    },
    submitForm () {
      if (!this.sockId) {
        this.$message.error('socket未连接成功,请刷新再尝试!');
        window.location.reload();
        return false;
      }
      this.$refs.roomForm.validate((valid) => {
        if (valid) {
        // 检查该房间人数
          this.canClickBtn = false;
          socket.emit('checkRoom', {
            roomId: this.roomForm.roomId,
            sockId: this.sockId,
            userName: this.roomForm.userName
          });
        } else {
          console.log('error submit!!');
        }
      });
    },
    resetForm () {
      this.$refs.roomForm.resetFields();
      this.roomForm.roomId = '';
      this.roomForm.userName = '';
    },
    // 发送视频
    toSendVideo () {
      socket.emit('toSendVideo', this.user);
      VIDEO_VIEW.showStartVideoModalByReceiver(this.receiveUser);
    },
    initVIDEO_VIEWSdk () {
      const configOptios = {
        startVideoCancelCb: this.startVideoCancelCb,
        receiveVideoCancelCb: this.receiveVideoCancelCb,
        receiveVideoAnswerCb: this.receiveVideoAnswerCb,
        hangUpVideoCb: this.hangUpVideoCb,
        openMikeCb: this.openMikeCb,
        closeMikeCb: this.closeMikeCb,
        openCammerCb: this.openCammerCb,
        closeCammerCb: this.closeCammerCb,
        toScreenCb: this.toScreenCb,
      };
      VIDEO_VIEW.configCallBack(configOptios);
    },
    startVideoCancelCb () {
      socket.emit('cancelSendVideo', this.user);
      VIDEO_VIEW.hideAllVideoModal();
    },
    receiveVideoCancelCb () {
      socket.emit('rejectReceiveVideo', this.user);
      VIDEO_VIEW.hideAllVideoModal();
    },
    receiveVideoAnswerCb () {
      socket.emit('answerVideo', this.user);
    },
    hangUpVideoCb () {
      socket.emit('hangupVideo', this.user);
    },
    openMikeCb () {

    },
    closeMikeCb () {

    },
    openCammerCb () {

    },
    closeCammerCb () {

    },
    toScreenCb () {

    },
    async createLocalVideoStream () {
      const constraints = { audio: true, video: true };
      const localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('localStream:', localStream);
      return localStream;
    },
    initPeerListen () {
      this.peer.onicecandidate = (event) => {
        if (event.candidate) { socket.emit('addIceCandidate', { candidate: event.candidate, user: this.user }); }
      };
      this.peer.onaddstream = (event) => {
        // 拿到对方的视频流
        document.querySelector('#echat-remote-1').srcObject = event.stream;
      };
      this.peer.onclose = () => {
      };
    },
  }
};
</script>

<style>
.m-room-wrapper{
    margin-top: 20px;
}
.m-room-wrapper .box-card {
    width: 480px;
}
.m-room-wrapper .box-card .item{
    padding: 18px 0;
}
</style>
