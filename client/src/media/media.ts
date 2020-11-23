const defaultConstraints: MediaStreamConstraints = {
  audio: true,
  video: {
    width: 320,
    frameRate: 30,
  },
};

class MediaManager {
  userStream?: MediaStream;
  supportedConstraints?: MediaTrackSupportedConstraints;
  constraints = defaultConstraints

  constructor() {
    this.getSupportedConstraints()
    // Enable echoCancellation if supported
    if(this.supportedConstraints?.echoCancellation == true) {
      this.constraints = {
        ...this.constraints,
        audio: {
          echoCancellation: true
        }
      }
    }
  }

  // 捕捉人像流
  async getUserMedia() {
    try {
      if(!this.userStream) this.userStream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
    } catch (err) {
      console.error('Error: ' + err);
    }
    return this.userStream!;
  }

  stopUserMedia() {
    this.userStream?.getTracks().forEach(track => track.stop())
    this.userStream = undefined;
  }

  private getSupportedConstraints() {
    return this.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
  }
}

export default new MediaManager();
