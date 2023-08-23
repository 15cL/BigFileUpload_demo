//创建服务器
const express = require("express");
const app = express();

var multipart = require("connect-multiparty");

var multipartMiddleware = multipart();

// 跨域
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

// # 解析json编码数据
app.use(express.json());

app.use(cors()); //跨域

// 统一设置响应头
app.all("*", (req, res, next) => {
  // 输出 JSON 格式
  res.setHeader("Content-Type", "application/json;charset=utf-8"); //设置response编码为utf-8

  next();
});

app.listen(3000, () => {
  console.log("服务器已启动 http://127.0.0.1:3000");
});

// 用于检测是否存在用于存放文件的路径，不存在则创建路径
const createFolder = function (folder) {
  try {
    fs.accessSync(folder);
  } catch (e) {
    fs.mkdirSync(folder);
  }
};

// 文件上传的路径
var uploadFolder = "./uploads";
// 创建文件夹
createFolder(uploadFolder);
createFolder("./uploads/temp");
createFolder("./uploads/download");

const upload = multer({ dest: "./uploads/temp" });

app.post("/upload", upload.single("file"), (req, res) => {
  // 重命名文件
  fs.renameSync(req.file.path, "./uploads/temp/" + req.body.hash);

  return res.send({ status: 0, message: "上传成功" });
});

app.post("/finish", multipartMiddleware, (req, res) => {
  // 读取temp文件夹中的分片，并返回数组
  let chunks = [];
  let arr = fs.readdirSync("./uploads/temp");
  arr.forEach((v) => {
    if (v.indexOf(req.body.fileHash) != -1) {
      chunks.push(v);
    }
  });
  console.log(chunks.length);
  //创建存储文件
  const filePath = path.join(
    "./uploads/download",
    req.body.fileHash + req.body.name
  );
  fs.writeFileSync(filePath, "");

  // 判断分片数目是否正确
  if (chunks.length < req.body.chunks || chunks.length == 0) {
    fs.unlinkSync("./uploads/download/" + req.body.fileHash + req.body.name);
    return res.send({ status: 1, message: "切片文件数量不符合" });
  }

  for (let i = 0; i < chunks.length; i++) {
    // 将分片内容写入存储文件中
    fs.appendFileSync(
      filePath,
      fs.readFileSync("./uploads/temp/" + `${req.body.fileHash}-${i}`)
    );

    // 删除已写入分片
    fs.unlinkSync("./uploads/temp/" + `${req.body.fileHash}-${i}`);
  }
  return res.send({ status: 0, message: "收到上传结束命令" });
});

// 秒传实现
app.post("/verify", (req, res) => {
  const files = fs.readdirSync("./uploads/download");
  files.forEach((e) => {
    if (e.indexOf(req.body.fileHash) != -1) {
      return res.send({ status: 0, message: "上传成功" });
    }
  });
  return res.send({ status: 1, message: "服务器查询不到该文件" });
});

// 恢复上传、继续上传检查已上传切片
app.get("/already", (req, res) => {
  const files = fs.readdirSync("./uploads/temp");
  let arr = [];
  files.forEach((e) => {
    if (e.indexOf(req.query.fileHash) != -1) {
      arr.push(e);
    }
  });
  if (arr.length) {
    return res.send({ status: 0, message: "查询到部分切片", data: arr });
  }
  return res.send({ status: 1, message: "查询不到切片" });
});
