const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || "https://192.168.1.2";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: "application/x-apple-aspen-config" }));
app.use(bodyParser.text({ type: "text/plain" }));
app.use(bodyParser.raw({ type: "application/pkcs7-signature" }));

// 根路径 - 直接使用智能 HTML 页面
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 生成 mobileconfig
app.get("/get-udid", (req, res) => {
  const token = uuidv4().toUpperCase(); // 生成唯一 token

  const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <dict>
    <key>URL</key>
    <string>${DOMAIN}/callback</string>
    <key>DeviceAttributes</key>
    <array>
      <string>UDID</string>
      <string>IMEI</string>
      <string>ICCID</string>
      <string>VERSION</string>
      <string>PRODUCT</string>
    </array>
  </dict>
  <key>PayloadOrganization</key>
  <string>com.udid.server</string>
  <key>PayloadDisplayName</key>
  <string>查询设备UDID</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
  <key>PayloadUUID</key>
  <string>${token}</string>
  <key>PayloadIdentifier</key>
  <string>com.udid.server</string>
  <key>PayloadDescription</key>
  <string>本文件仅用来获取设备UDID</string>
  <key>PayloadType</key>
  <string>Profile Service</string>
</dict>
</plist>`;

  res.setHeader("Content-Type", "application/x-apple-aspen-config");
  res.setHeader("Content-Disposition", "attachment; filename=udid.mobileconfig");
  res.send(mobileconfig);
});

// 处理 iOS 回调，获取 UDID 后重定向
app.all("/callback", (req, res) => {
  let udid = "未获取到UDID";
  let product = "未知设备";
  let version = "未知版本";

  if (req.method === "POST") {
    try {
      const bodyStr = req.body.toString("utf8");
      console.log("收到iOS回调:", bodyStr.substring(0, 500));

      const udidMatch = bodyStr.match(/<key>UDID<\/key>\s*<string>([^<]+)<\/string>/i);
      const productMatch = bodyStr.match(/<key>PRODUCT<\/key>\s*<string>([^<]+)<\/string>/i);
      const versionMatch = bodyStr.match(/<key>VERSION<\/key>\s*<string>([^<]+)<\/string>/i);

      if (udidMatch) {
        udid = udidMatch[1].trim();
        console.log("匹配到 UDID:", udid);
      }
      if (productMatch) {
        product = productMatch[1].trim();
        console.log("匹配到 PRODUCT:", product);
      }
      if (versionMatch) {
        version = versionMatch[1].trim();
        console.log("匹配到 VERSION:", version);
      }

      // 如果获取到有效信息，重定向到根路径并传递参数
      if (udid !== "未获取到UDID") {
        console.log("设备信息已获取，重定向到结果页面");
        const redirectUrl = `/?udid=${encodeURIComponent(udid)}&product=${encodeURIComponent(
          product
        )}&version=${encodeURIComponent(version)}`;
        res.redirect(301, redirectUrl);
        return;
      }
    } catch (error) {
      console.log("解析错误:", error);
    }
  }

  // 如果没有获取到有效信息，重定向到主页
  console.log("未获取到有效信息，重定向到主页");
  res.redirect(301, "/");
});

app.listen(PORT, () => {
  console.log(`UDID server running at http://localhost:${PORT}`);
});
