import "./Avatar.scss";

import React, { useEffect, useState } from "react";
import peer, { Status } from "../media/peer";
import { PhoneFilled, StopFilled } from "@ant-design/icons";

type AvatarProps = {
  children: string;
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onCallClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onHangupClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  color: string;
};

//StopFilled hangup

export const Avatar = ({
  children,
  color,
  onClick,
  onCallClick,
  onHangupClick,
}: AvatarProps) => {
  const [idle, setIdle] = useState(true);
  useEffect(() => {
    peer.on("status-change", (status) => {
      setIdle(status === Status.Idle);
    });
  }, []);

  return (
    <>
      <div className="Avatar" style={{ background: color }} onClick={onClick}>
        {children}
      </div>
      {idle ? (
        <div className="btn call-btn" onClick={onCallClick} title="Call">
          <PhoneFilled />
        </div>
      ) : (
        <div className="btn hangup-btn" onClick={onHangupClick} title="Hang Up">
          <StopFilled />
        </div>
      )}
    </>
  );
};
