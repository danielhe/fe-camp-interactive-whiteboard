class Rectangle {
  matrix = new Matrix();
  constructor(x, y, x1, y1, styles = { width: 2, color: "#ff4b59" }) {
    this.x = x;
    this.y = y;
    this.x1 = x1;
    this.y1 = y1;
    this.id = genId();
    this.strokeWidth = styles.width;
    this.strokeColor = styles.color;
    this.selected = false;
  }
  // 原始边界点（nw, ne, se, sw）
  get points() {
    return [[this.x, this.y],[this.x1, this.y],[this.x1, this.y1],[this.x, this.y1],];
  }
  get center() { return [(this.x + this.x1) / 2, (this.y + this.y1) / 2];}
  get boundPoints() { return this.matrix.transformRect(this.points); }
  get height() { return Math.abs(this.y - this.y1);}
  get width() { return Math.abs(this.x - this.x1); }

  getRotateHandle = points => [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2];
  getRotateCenter = points => [(points[0][0] + points[2][0]) / 2, (points[0][1] + points[2][1]) / 2];
  transform = (matrix) => this.matrix = this.matrix.prepend(matrix);
  translate = (point) => this.transform(new Matrix().translate(point));
  scale = (sx, sy, bp) => this.transform(new Matrix().scale(sx, sy, bp));
  rotate = (deg, bp) => this.transform(new Matrix().rotate(deg, bp));

  isPointOn(x, y) { // hitTest
    const points = this.boundPoints;
    if (this.selected) {
      const idx = points.findIndex((item) => nearby(item[0], item[1], x, y, 6));
      if (idx !== -1) return dirs[idx]; // 缩放
      const [rx, ry] = this.getRotateHandle(points);
      if (nearby(rx, ry, x, y, 8)) return "rotate"; // 旋转
    }
    return containRect(points, this.strokeWidth + 2, x, y) ? "bound" : ""; // 平移
  }
  draw(ctx) {
    ctx.save();
    const points = this.boundPoints;
    ctx.beginPath();
    ctx.lineWidth = this.strokeWidth;
    ctx.strokeStyle = this.strokeColor;
    ctx.moveTo.apply(ctx, points[0]);
    ctx.lineTo.apply(ctx, points[1]);
    ctx.lineTo.apply(ctx, points[2]);
    ctx.lineTo.apply(ctx, points[3]);
    ctx.closePath();
    ctx.stroke();
    if (this.selected) this.drawHandles(points);
    ctx.restore();
  }
  drawHandles(points) {
    ctx.fillStyle = "#007fff";
    points.forEach(([x, y]) => ctx.fillRect(x - 3, y - 3, 6, 6));
    const [rx, ry] = this.getRotateHandle(points); // rotate handle
    ctx.fillRect(rx - 3, ry - 3, 6, 6);
  }
}
