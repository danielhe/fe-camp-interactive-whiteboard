import Peer from "peerjs";
import { ConnectionEventType } from "./enums";
import media from "./media";
import { showPreviewModel, showRingingModel, showHangupModel } from "./modals";
import { toast } from "react-toastify";
import { EventEmitter } from "eventemitter3";
import { PEER_SERVER } from "../data";

export enum Status {
  Calling = 1,
  Ringing,
  OnTheCall,
  Idle,
}

export class Connection extends EventEmitter {
  peer?: Peer;
  currentCall?: Peer.MediaConnection;
  private _currentStatus = Status.Idle;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  initialized = false;

  get currentStatus() {
    return this._currentStatus;
  }

  set currentStatus(status: Status) {
    if (this._currentStatus !== status) {
      this._currentStatus = status;
      this.emit("status-change", this._currentStatus);
    }
  }

  /**
   * 转化socketId为合法的peerId
   */
  normalizePeerId = (id: string) => id.replace('_','')

  initialize(id: string) {
    const peerOpts: Peer.PeerJSOption = {
      debug: 3,
      config: {
        'iceServers':[{ urls: "stun:stun1.l.google.com:19302" }],
      },
    }
    const matches = PEER_SERVER.match(/(https?):\/\/([^:/]*)(?::(\d+))?/)!
    if(matches) {
      if(matches[1] === "https") peerOpts.secure = true;
      peerOpts.host = matches[2];
      if(matches[3]) peerOpts.port = parseInt(matches[3], 10);
      if(matches[4]) peerOpts.path = matches[4];
    }
    const peer = new Peer(this.normalizePeerId(id), peerOpts);
    this.initialized = true;
    this.peer = peer;

    peer.on("open", () => {
      console.log("connection open", arguments);
    });

    // When someone connects to your session:
    peer.on("connection", (connection) => {
      let conn = connection;
      let peerId = conn.peer;
      console.log(`${peerId} connected~`);
    });

    peer.on("disconnected", () => {
      console.log("---peer disconnected--");
      // peer.reconnect();
    });

    // callee
    peer.on("call", async (call) => {
      this.addListenerToCall(call);
      this.currentStatus = Status.Ringing;
      showRingingModel(
        async () => {
          // accept
          this.localStream = await media.getUserMedia()!;
          call.answer(this.localStream); // Answer the call with an A/V stream.
          this.emit("local-stream-add", this.localStream);
        },
        () => {
          this.hangup();
        },
      );
    });

    peer.on("error", (err) => {
      this.hangup();
      alert("An error ocurred with peer: " + err);
      console.error(err);
    });
  }

  /**
   * Add event listener to current call.
   * @param call
   */
  addListenerToCall = (call: Peer.MediaConnection) => {
    this.currentCall = call;
    // @ts-ignore
    window._currentCall = this.currentCall;

    this.currentCall.on(ConnectionEventType.Stream, (remoteStream) => {
      this.currentStatus = Status.OnTheCall;
      this.handleReceiveStream(remoteStream);
    });

    // PeerJS 调用connection.close()不会触发Ice的closed，这是通过iceState变为disconnected判断失去连接（会有几秒钟的延迟）
    // see: https://github.com/peers/peerjs/issues/752
    this.currentCall.on(ConnectionEventType.Close, () => {
      // 收到close信息

      toast("通话结束", {
        autoClose: 1000,
      });
      this.currentStatus = Status.Idle;
    });

    this.currentCall.on(ConnectionEventType.Error, (err) => {
      console.error("通话错误", err);
      this.currentStatus = Status.Idle;
    });

    //@ts-ignore
    this.currentCall.on(ConnectionEventType.IceStateChanged, (iceState: RTCIceConnectionState) => {
      // PeerJS 调用connection.close()不会触发Ice的closed，这是通过iceState变为disconnected判断失去连接（会有几秒钟的延迟）
      // see: https://github.com/peers/peerjs/issues/752
      if(iceState === 'disconnected') {
        toast("通话结束", {
          autoClose: 1000,
        });
        this.currentStatus = Status.Idle;
      }
    });
  };

  handleReceiveStream = (stream: MediaStream) => {
    // Show stream in some <video> element.
    this.remoteStream = stream;
    this.emit("remote-stream-add", this.remoteStream);
  };

  // caller
  call = async (id: string) => {
    this.localStream = await media.getUserMedia()!;

    showPreviewModel(
      () => {
        this.emit("local-stream-add", this.localStream);
        const call = this.peer!.call(this.normalizePeerId(id), this.localStream!);
        this.addListenerToCall(call);
        this.currentStatus = Status.Calling;
      },
      () => {
        media.stopUserMedia();
      },
      this.localStream,
    );
  };

  hangupWithConfirm = () => {
    showHangupModel(() => this.hangup());
  };

  /**
   * 主动挂断
   */
  hangup = () => {
    this.currentCall?.close();
    this.currentStatus = Status.Idle;
    // 主动挂断
    this.emit("hangup", this.currentCall);
  };
}

const peer = new Connection();
//@ts-ignore
window._peer = peer;
export default peer;
