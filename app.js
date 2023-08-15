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
createFolder(uploadFolder);
createFolder("./uploads/temp");

const upload = multer({ dest: "./uploads/temp" });

// // 导入并注册用户路由模块
app.post("/upload", upload.single("file"), (req, res) => {
  console.log(req.file);
  fs.renameSync(
    req.file.path,
    "./uploads/temp/" + `${req.body.context}=${req.body.index}`
  );

  return res.send({ status: 0, message: "上传成功" });
});

app.post("/finish", multipartMiddleware, (req, res) => {
  const chunks = fs.readdirSync("./uploads/temp");
  console.log(req.body);
  console.log(chunks);
  const filePath = path.join("./uploads", req.body.name);

  //创建存储文件
  fs.writeFileSync(filePath, "");

  if (chunks.length != req.body.chunks || chunks.length == 0) {
    return res.send({ status: 0, message: "切片文件数量不符合" });
  }
  for (let i = 0; i < chunks.length; i++) {
    // 将分片内容写入存储文件中
    fs.appendFileSync(
      filePath,
      fs.readFileSync("./uploads/temp/" + `${req.body.context}=${i}`)
    );

    // 删除已写入分片
    fs.unlinkSync("./uploads/temp/" + `${req.body.context}=${i}`);
  }
  return res.send({ status: 0, message: "收到请求结束命令" });
});
