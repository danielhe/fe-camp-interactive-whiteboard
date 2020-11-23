import React from "react";
import { menu, palette } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { t } from "../i18n";
import { register } from "./register";

export const actionEnableCamera = register({
  name: "enableCamera",
  perform: (_, appState) => ({
    appState: {
      ...appState,
      openMenu: appState.openMenu === "canvas" ? null : "canvas",
    },
    commitToHistory: false,
  }),
  PanelComponent: ({ appState, updateData }) => (
    <ToolButton
      type="button"
      icon={menu}
      aria-label={t("buttons.menu")}
      onClick={updateData}
      selected={appState.openMenu === "canvas"}
    />
  ),
});

export const actionEnableMic = register({
  name: "enableMic",
  perform: (_, appState) => ({
    appState: {
      ...appState,
      openMenu: appState.openMenu === "canvas" ? null : "canvas",
    },
    commitToHistory: false,
  }),
  PanelComponent: ({ appState, updateData }) => (
    <ToolButton
      type="button"
      icon={menu}
      aria-label={t("buttons.menu")}
      onClick={updateData}
      selected={appState.openMenu === "canvas"}
    />
  ),
});

