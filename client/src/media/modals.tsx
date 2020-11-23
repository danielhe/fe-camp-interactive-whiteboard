import React, { useRef, useEffect } from "react";
import { Modal } from "antd";
import "./modals.scss";

export const Video = ({
  media,
  className,
  muted = false,
}: {
  media: MediaStream;
  className: string;
  muted?: boolean;
}) => {
  const videoEl = useRef(null as HTMLVideoElement | null);
  // 只在组件挂载的时候设置src, mediaStream 不好做Diff
  useEffect(() => {
    videoEl.current!.srcObject = media;
  }, []);
  return (
    <video
      className={className}
      autoPlay
      playsInline
      ref={videoEl}
      muted={muted}
    ></video>
  );
};

export const showPreviewModel = (
  onOk: any,
  onCancel: any,
  media: MediaStream,
) => {
  Modal.confirm({
    content: <Video media={media} className="preview-video" muted={true} />,
    cancelText: "取消",
    className: "excalidraw-modal",
    okText: "连线",
    onCancel,
    keyboard: false,
    width: 350,
    onOk,
    maskStyle: { backgroundColor: "rgba(0, 0, 0, 0.2)" },
  });
};

export const showRingingModel = (onOk: any, onCancel: any) => {
  Modal.confirm({
    content: "You have a coming call...",
    cancelText: "取消",
    className: "excalidraw-modal",
    okText: "应答",
    onCancel,
    keyboard: false,
    width: 400,
    onOk,
    maskStyle: {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
  });
};

export const showHangupModel = (onOk: any) => {
  Modal.confirm({
    content: "确认结束通话吗~",
    cancelText: "取消",
    className: "excalidraw-modal",
    okText: "挂断",
    keyboard: false,
    width: 400,
    onOk,
    maskStyle: {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
  });
};
