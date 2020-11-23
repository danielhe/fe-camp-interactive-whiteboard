const canvas = document.querySelector("#draw-panel");
const ctx = canvas.getContext("2d");
const width = 600;
const height = 400;
// 解决canvas 高分屏下模糊的问题
const deviceRatio = window.devicePixelRatio || 1;
canvas.width = width * deviceRatio;
canvas.height = height * deviceRatio;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
ctx.scale(deviceRatio, deviceRatio);

//全局状态
const items = [];
let needRefresh = false;

// 常量、工具
const dirs = ["nw", "ne", "se", "sw"];
const genId = ((idx) => () => ++idx)(0); //生成自增ID