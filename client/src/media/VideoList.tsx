import React, { Component } from "react";
import "./VideoList.scss";
import peer, { Status } from "./peer";
import { Video } from "./modals";
import Draggable from 'react-draggable';

interface User {
  url: string;
  name: string;
}

interface VideoListProps {
  users?: User[];
}
interface VideoListState {
  local: MediaStream | null,
  remote: MediaStream | null,
  show: boolean,
}

class VideoList extends Component<VideoListProps> {
  state = {
    local: null,
    remote: null,
    show: false,
  } as VideoListState;

  componentDidMount() {
    // FIXME: 节省时间，直接通过组件订阅时间的方式实现
    peer.on("local-stream-add", (local: MediaStream) => {
      this.setState({ local })
    });
    peer.on("remote-stream-add", (remote: MediaStream) => {
      this.setState({ remote })
    });
    peer.on("status-change", status => {
      if(status === Status.Idle) {
        this.setState({ remote: null, local: null })
      }
    })
  }
  render() {
    const {local, remote } = this.state;

    return (
      <Draggable bounds="parent">
        <div className="video-list">
          { local!== null ? <Video className="video-item" media={local} muted={true}></Video> : null }
          { remote!== null ? <Video className="video-item" media={remote}></Video> : null }
        </div>
      </Draggable>
    );
  }
}

export default VideoList;
