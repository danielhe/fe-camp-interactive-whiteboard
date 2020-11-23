/**
 * 处理鼠标事件，包括：
 * 绘制，拖拽，缩放，旋转，悬停状态等。
 */
function bindEvent() {
  let downPoint = null;
  let action;
  let hitElement = null;
  let isDragging = false;
  let currentElement = null;

  canvas.addEventListener("mousedown", (event) => {
    isDragging = true;
    needRefresh = true;
    if (hitElement) {
      hitElement.selected = true;
    } else {
      items.find((item) => (item.selected = false));
      downPoint = [event.offsetX, event.offsetY];
    }
  });

  canvas.addEventListener(
    "mousemove",
    ({ movementX, movementY, offsetX, offsetY }) => {
      if (isDragging == true) {
        needRefresh = true;
        if (action) { // transform
          const inverseMat = hitElement.matrix.inverse(); // 反转Matrix
          if (action === "bound") { // move
            hitElement.translate([movementX, movementY]);
          } else if (action === "rotate") { // rotate
            const points = hitElement.boundPoints;
            const [rx, ry] = hitElement.getRotateHandle(points);
            const [tx, ty] = inverseMat.transformPoint([rx + movementX, ry + movementY]); // 得到反解后的to
            const [fx, fy] = inverseMat.transformPoint([rx, ry]); // 得到反解后的from
            const angle = getAngle(hitElement.center, [tx, ty], [fx, fy]); // 获得原始的delta 角度
            hitElement.rotate(angle, hitElement.getRotateCenter(points)); // 基于中心点
          } else { // scale
            const idx = dirs.indexOf(action);
            if (idx === -1) return;
            const antiDir = dirs.indexOf(dirs[(idx + 2) % 4]);
            const point = hitElement.boundPoints[idx];
            const bp = hitElement.boundPoints[antiDir];
            const obp = hitElement.points[antiDir];

            let sx = 1.0, sy = 1.0;
            const toX = point[0] + movementX;
            const toY = point[1] + movementY;
            const [x, y] = inverseMat.transformPoint([toX, toY]); // 得到反解后的delta
            sx = Math.abs(x - obp[0]) / hitElement.width;
            sy = Math.abs(y - obp[1]) / hitElement.height;
            hitElement.scale(sx, sy, bp);
          }
        } else if (!currentElement) { // 创建
          if (!nearby(downPoint[0], downPoint[1], offsetX, offsetY, 8)) { // 移动delta大于 8px才触发绘制
            currentElement = new Rectangle(offsetX, offsetY, offsetX, offsetY);
            items.push(currentElement);
          }
        } else {// 绘制
          currentElement.x1 = offsetX;
          currentElement.y1 = offsetY;
        }
      } else {
        // hitTest
        hitElement = items.find( (item) => (action = item.isPointOn(offsetX, offsetY)));
        if (!hitElement) return canvas.style.cursor = "";
        if (action === "bound") return canvas.style.cursor = "move";
        if (action === "rotate") return canvas.style.cursor = "crosshair";
        canvas.style.cursor = `${action}-resize`;
      }
    }
  );

  canvas.addEventListener("mouseup", () => {
    isDragging = false;
    currentElement = null;
    downPoint = null;
  });
}
