import * as React from 'react';

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

interface ScreenshotDimensions {
  width: number;
  height: number;
}

export interface WebcamProps extends React.HTMLProps<HTMLVideoElement> {
  audio: boolean;
  audioConstraints?: MediaStreamConstraints['audio'];
  forceScreenshotSourceSize: boolean;
  imageSmoothing: boolean;
  mirrored: boolean;
  minScreenshotHeight?: number;
  minScreenshotWidth?: number;
  onUserMedia: (stream: MediaStream) => void;
  onUserMediaError: (error: string) => void;
  videoConstraints?: MediaStreamConstraints['video'];
}

interface WebcamState {
  hasUserMedia: boolean;
  src?: string;
}

export default class Webcam extends React.Component<WebcamProps, WebcamState> {
  static defaultProps = {
    audio: true,
    forceScreenshotSourceSize: false,
    imageSmoothing: true,
    mirrored: false,
    onUserMedia: () => {},
    onUserMediaError: () => {},
    screenshotFormat: 'image/webp',
    screenshotQuality: 0.92,
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private unmounted = false;

  stream!: MediaStream;
  video!: HTMLVideoElement | null;

  constructor(props: WebcamProps) {
    super(props);
    this.state = {
      hasUserMedia: false,
    };
  }

  componentDidMount() {
    const { state, props } = this;

    if (!hasGetUserMedia()) {
      props.onUserMediaError('getUserMedia not supported');
      return;
    }

    if (!state.hasUserMedia) {
      this.requestUserMedia();
    }
  }

  componentDidUpdate(nextProps: WebcamProps) {
    const { props } = this;

    if (!hasGetUserMedia()) {
      props.onUserMediaError('getUserMedia not supported');
      return;
    }

    const audioConstraintsChanged =
      JSON.stringify(nextProps.audioConstraints) !== JSON.stringify(props.audioConstraints);
    const videoConstraintsChanged =
      JSON.stringify(nextProps.videoConstraints) !== JSON.stringify(props.videoConstraints);
    const minScreenshotWidthChanged = nextProps.minScreenshotWidth !== props.minScreenshotWidth;
    const minScreenshotHeightChanged = nextProps.minScreenshotHeight !== props.minScreenshotHeight;
    if (videoConstraintsChanged || minScreenshotWidthChanged || minScreenshotHeightChanged) {
      this.canvas = null;
      this.ctx = null;
    }

    if (audioConstraintsChanged || videoConstraintsChanged) {
      this.stopAndCleanup();
      this.requestUserMedia();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.stopAndCleanup();
  }

  private static stopMediaStream(stream: MediaStream) {
    if (stream) {
      if (stream.getVideoTracks && stream.getAudioTracks) {
        stream.getVideoTracks().map((track) => track.stop());
        stream.getAudioTracks().map((track) => track.stop());
      } else {
        ((stream as unknown) as MediaStreamTrack).stop();
      }
    }
  }

  private stopAndCleanup() {
    const { state } = this;

    if (state.hasUserMedia) {
      Webcam.stopMediaStream(this.stream);

      if (state.src) {
        window.URL.revokeObjectURL(state.src);
      }
    }
  }

  private requestUserMedia() {
    const { props } = this;

    const sourceSelected = (audioConstraints: any, videoConstraints: any) => {
      const constraints: MediaStreamConstraints = {
        video: typeof videoConstraints !== 'undefined' ? videoConstraints : true,
      };

      if (props.audio) {
        constraints.audio = typeof audioConstraints !== 'undefined' ? audioConstraints : true;
      }

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          if (this.unmounted) {
            Webcam.stopMediaStream(stream);
          } else {
            //@ts-ignore
            this.handleUserMedia(null, stream);
          }
        })
        .catch((e) => {
          this.handleUserMedia(e);
        });
    };

    if ('mediaDevices' in navigator) {
      sourceSelected(props.audioConstraints, props.videoConstraints);
    } else {
      const optionalSource = (id: string) => ({ optional: [{ sourceId: id }] });

      const constraintToSourceId = (constraint: any) => {
        const { deviceId } = constraint;

        if (typeof deviceId === 'string') {
          return deviceId;
        }

        if (Array.isArray(deviceId) && deviceId.length > 0) {
          return deviceId[0];
        }

        if (typeof deviceId === 'object' && deviceId.ideal) {
          return deviceId.ideal;
        }

        return null;
      };

      // @ts-ignore: deprecated api
      MediaStreamTrack.getSources((sources) => {
        let audioSource = null;
        let videoSource = null;

        sources.forEach((source: any) => {
          if (source.kind === 'audio') {
            audioSource = source.id;
          } else if (source.kind === 'video') {
            videoSource = source.id;
          }
        });

        const audioSourceId = constraintToSourceId(props.audioConstraints);
        if (audioSourceId) {
          audioSource = audioSourceId;
        }

        const videoSourceId = constraintToSourceId(props.videoConstraints);
        if (videoSourceId) {
          videoSource = videoSourceId;
        }

        sourceSelected(optionalSource(audioSource), optionalSource(videoSource));
      });
    }
  }

  private handleUserMedia(err: string, stream?: MediaStream) {
    const { props } = this;

    if (err || !stream) {
      this.setState({ hasUserMedia: false });
      props.onUserMediaError(err);

      return;
    }

    this.stream = stream;

    try {
      if (this.video) {
        this.video.srcObject = stream;
      }
      this.setState({ hasUserMedia: true });
    } catch (error) {
      this.setState({
        hasUserMedia: true,
        src: window.URL.createObjectURL(stream),
      });
    }

    props.onUserMedia(stream);
  }

  render() {
    const { state, props } = this;

    const {
      audio,
      forceScreenshotSourceSize,
      onUserMedia,
      onUserMediaError,
      minScreenshotWidth,
      minScreenshotHeight,
      audioConstraints,
      videoConstraints,
      imageSmoothing,
      mirrored,
      style = {},
      ...rest
    } = props;

    const videoStyle = mirrored
      ? { ...style, transform: `${style.transform || ''} scaleX(-1)` }
      : style;

    return (
      <video
        autoPlay
        src={state.src}
        muted={audio}
        playsInline
        ref={(ref) => {
          this.video = ref;
        }}
        //@ts-ignore
        style={videoStyle}
        {...rest}
      />
    );
  }
}
