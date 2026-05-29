# 杭州西湖 3D 漫游

一个基于 Vite、React 和 Three.js 的杭州西湖文化景观 3D 漫游样板。当前版本把 `3dzhanlan` 的 3D 展厅外壳、全局可拖动导览桌宠和西湖公开素材库迁移到独立的 `hangzhou3d` 仓库中。

## 本地运行

```bash
npm install
npm run dev
```

## 数据说明

- 景点、年代和导览文本仍是 MVP mock 数据，主题围绕西湖十景、苏堤、白堤、雷峰塔、三潭印月、南屏晚钟、双峰插云等公开文化景观。
- 地图为项目内自绘的地形可视化 3D 导览图，不使用旅游地图截图和第三方瓦片。坐标与景点选择参考公开资料，并在地图视图保留 `© OpenStreetMap contributors` 标注。
- 公开素材库放在 `public/assets/westlake/`，资料索引为 `public/assets/westlake/library.json`，前端资料入口会展示标题、来源、作者、授权和说明。
- 素材来源包括 Wikimedia Commons 的西湖景观照片、1916 年《浙江名胜胜迹西湖最新图》、李嵩《西湖图卷》、叶肖岩《西湖十景图 两峰插云》，以及基于 OpenStreetMap 公开地理信息重绘的 `terrain-west-lake.svg`。
- 参考资料包括 UNESCO World Heritage Centre 的 West Lake Cultural Landscape of Hangzhou 页面、Wikidata/Wikimedia Commons 的 West Lake 与 Ten Scenes 条目、OpenStreetMap 公开地理数据。

## 素材库范围

- 十二处导览节点：断桥残雪、白堤、平湖秋月、曲院风荷、双峰插云、苏堤春晓、花港观鱼、三潭印月、雷峰夕照、南屏晚钟、柳浪闻莺、湖滨晴雨。
- 十景已补齐：新增双峰插云实景国保碑照片与宋代叶肖岩《两峰插云》图像。
- 三类资料素材：当代景观照片、历史图像/地图、地形可视化图。
- 当前公开资料库共 16 项，每项记录来源页面、作者、授权和简短说明。

## 导览桌宠

- 桌宠全局常驻、可拖动，支持睡眠、气泡和聊天状态。
- 点击当前景点或地图节点后，桌宠会围绕当前上下文讲解。
- 当前接入远程导览接口时会优先请求服务端；接口不可用时会退回本地 mock 回答。
