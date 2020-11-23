/**
 * 计算三个点的夹角
 * @param {*} cp
 * @param {*} sp
 * @param {*} ep
 */
const getAngle = (cp, sp, ep) => {
  const radian =
    Math.atan2(sp[1] - cp[1], sp[0] - cp[0]) -
    Math.atan2(ep[1] - cp[1], ep[0] - cp[0]);
  return (radian * 180) / Math.PI;
};

/**
 * 判断两个点的距离在一个给定的范围内
 * @param {d} x
 * @param {*} y
 * @param {*} x1
 * @param {*} y1
 * @param {*} distance
 */
const nearby = (x, y, x1, y1, distance = 4) => {
  const dx = x - x1,
    dy = y - y1;
  return Math.sqrt(dx * dx + dy * dy) < distance;
};

/**
 * 线段包含判断
 * @param  {Number}  x0
 * @param  {Number}  y0
 * @param  {Number}  x1
 * @param  {Number}  y1
 * @param  {Number}  lineWidth
 * @param  {Number}  x
 * @param  {Number}  y
 * @return {Boolean}
 */
const containStrokeLine = (x0, y0, x1, y1, lineWidth, x, y) => {
  if (lineWidth === 0) {
    return false;
  }
  let _l = lineWidth;
  let _a = 0;
  let _b = x0;
  // Quick reject
  if (
    (y > y0 + _l && y > y1 + _l) ||
    (y < y0 - _l && y < y1 - _l) ||
    (x > x0 + _l && x > x1 + _l) ||
    (x < x0 - _l && x < x1 - _l)
  ) {
    return false;
  }

  if (x0 !== x1) {
    _a = (y0 - y1) / (x0 - x1);
    _b = (x0 * y1 - x1 * y0) / (x0 - x1);
  } else {
    return Math.abs(x - x0) <= _l / 2;
  }
  let tmp = _a * x - y + _b;
  let _s = (tmp * tmp) / (_a * _a + 1);
  return _s <= ((_l / 2) * _l) / 2;
};

const containRect = (p, lineWidth, x, y) => {
  return (
    containStrokeLine(p[0][0], p[0][1], p[1][0], p[1][1], lineWidth, x, y) ||
    containStrokeLine(p[1][0], p[1][1], p[2][0], p[2][1], lineWidth, x, y) ||
    containStrokeLine(p[2][0], p[2][1], p[3][0], p[3][1], lineWidth, x, y) ||
    containStrokeLine(p[3][0], p[3][1], p[0][0], p[0][1], lineWidth, x, y)
  );
};
