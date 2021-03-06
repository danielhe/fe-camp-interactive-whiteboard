import { encryptAESGEM, SocketUpdateDataSource } from "../data";

import { SocketUpdateData } from "../types";
import { BROADCAST, SCENE } from "../constants";
import App from "./App";
import {
  getElementMap,
  getSceneVersion,
  getSyncableElements,
} from "../element";
import { ExcalidrawElement } from "../element/types";
import peer from "../media/peer";

class Portal {
  app: App;
  socket: SocketIOClient.Socket | null = null;
  peer: any;
  socketInitialized: boolean = false; // we don't want the socket to emit any updates until it is fully initialized
  roomID: string | null = null;
  roomKey: string | null = null;
  broadcastedElementVersions: Map<string, number> = new Map();

  constructor(app: App) {
    this.app = app;
  }

  open(socket: SocketIOClient.Socket, id: string, key: string) {
    this.socket = socket;
    //@ts-ignore
    window._socket = socket;
    this.roomID = id;
    this.roomKey = key;

    this.socket.on("connect", () => {
      this.openPeer(this.socket!.id)
    });

    // Initialize socket listeners (moving from App)
    this.socket.on("init-room", () => {
      if (this.socket) {
        this.socket.emit("join-room", this.roomID);
      }
    });
    this.socket.on("new-user", async (_socketId: string) => {
      this.broadcastScene(SCENE.INIT, /* syncAll */ true);
    });
    this.socket.on("room-user-change", (clients: string[]) => {
      // 设置所有的user
      this.app.setCollaborators(clients);
    });
  }

  private openPeer(socketId: string) {
    peer.initialize(socketId);
  }

  close() {
    if (!this.socket) {
      return;
    }
    this.socket.close();
    this.socket = null;
    this.roomID = null;
    this.roomKey = null;
  }

  isOpen() {
    return !!(
      this.socketInitialized &&
      this.socket &&
      this.roomID &&
      this.roomKey
    );
  }

  async _broadcastSocketData(
    data: SocketUpdateData,
    volatile: boolean = false,
  ) {
    if (this.isOpen()) {
      // const json = JSON.stringify(data);
      // const encoded = new TextEncoder().encode(json);
      // // 对传输信息进行加密
      // const encrypted = await encryptAESGEM(encoded, this.roomKey!);
      this.socket!.emit(
        volatile ? BROADCAST.SERVER_VOLATILE : BROADCAST.SERVER,
        this.roomID,
        data,
        // encrypted.data,
        // encrypted.iv,
      );
    }
  }

  broadcastScene = async (
    sceneType: SCENE.INIT | SCENE.UPDATE,
    syncAll: boolean,
  ) => {
    if (sceneType === SCENE.INIT && !syncAll) {
      throw new Error("syncAll must be true when sending SCENE.INIT");
    }

    let syncableElements = getSyncableElements(
      this.app.getSceneElementsIncludingDeleted(),
    );

    if (!syncAll) {
      // sync out only the elements we think we need to to save bandwidth.
      // periodically we'll resync the whole thing to make sure no one diverges
      // due to a dropped message (server goes down etc).
      syncableElements = syncableElements.filter(
        (syncableElement) =>
          !this.broadcastedElementVersions.has(syncableElement.id) ||
          syncableElement.version >
            this.broadcastedElementVersions.get(syncableElement.id)!,
      );
    }

    const data: SocketUpdateDataSource[typeof sceneType] = {
      type: sceneType,
      payload: {
        elements: syncableElements,
      },
    };
    const currentVersion = this.app.getLastBroadcastedOrReceivedSceneVersion();
    const newVersion = Math.max(
      currentVersion,
      getSceneVersion(this.app.getSceneElementsIncludingDeleted()),
    );
    this.app.setLastBroadcastedOrReceivedSceneVersion(newVersion);

    for (const syncableElement of syncableElements) {
      this.broadcastedElementVersions.set(
        syncableElement.id,
        syncableElement.version,
      );
    }

    const broadcastPromise = this._broadcastSocketData(
      data as SocketUpdateData,
    );

    if (syncAll && this.app.state.isCollaborating) {
      await Promise.all([
        broadcastPromise,
        this.app.saveCollabRoomToFirebase(syncableElements),
      ]);
    } else {
      await broadcastPromise;
    }
  };

  broadcastMouseLocation = (payload: {
    pointer: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["pointer"];
    button: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["button"];
  }) => {
    if (this.socket?.id) {
      const data: SocketUpdateDataSource["MOUSE_LOCATION"] = {
        type: "MOUSE_LOCATION",
        payload: {
          socketId: this.socket.id, //使用socket.id 作为用户的唯一标识
          pointer: payload.pointer,
          button: payload.button || "up",
          selectedElementIds: this.app.state.selectedElementIds,
          username: this.app.state.username,
        },
      };
      return this._broadcastSocketData(
        data as SocketUpdateData,
        true, // volatile
      );
    }
  };

  reconcileElements = (sceneElements: readonly ExcalidrawElement[]) => {
    const currentElements = this.app.getSceneElementsIncludingDeleted();
    // create a map of ids so we don't have to iterate
    // over the array more than once.
    const localElementMap = getElementMap(currentElements);

    // Reconcile
    const newElements = sceneElements
      .reduce((elements, element) => {
        // if the remote element references one that's currently
        // edited on local, skip it (it'll be added in the next step)
        if (
          element.id === this.app.state.editingElement?.id ||
          element.id === this.app.state.resizingElement?.id ||
          element.id === this.app.state.draggingElement?.id
        ) {
          return elements;
        }

        if (
          localElementMap.hasOwnProperty(element.id) &&
          localElementMap[element.id].version > element.version
        ) {
          elements.push(localElementMap[element.id]);
          delete localElementMap[element.id];
        } else if (
          localElementMap.hasOwnProperty(element.id) &&
          localElementMap[element.id].version === element.version &&
          localElementMap[element.id].versionNonce !== element.versionNonce
        ) {
          // resolve conflicting edits deterministically by taking the one with the lowest versionNonce
          if (localElementMap[element.id].versionNonce < element.versionNonce) {
            elements.push(localElementMap[element.id]);
          } else {
            // it should be highly unlikely that the two versionNonces are the same. if we are
            // really worried about this, we can replace the versionNonce with the socket id.
            elements.push(element);
          }
          delete localElementMap[element.id];
        } else {
          elements.push(element);
          delete localElementMap[element.id];
        }

        return elements;
      }, [] as Mutable<typeof sceneElements>)
      // add local elements that weren't deleted or on remote
      .concat(...Object.values(localElementMap));
    return newElements;
  };
}

export default Portal;
