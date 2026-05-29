# 杭州西湖 3D 漫游

一个基于 Vite、React 和 Three.js 的杭州西湖文化景观 3D 漫游样板。当前版本把 `3dzhanlan` 的 3D 展厅外壳和全局可拖动导览桌宠迁移到独立的 `hangzhou3d` 仓库中。

## 本地运行

```bash
npm install
npm run dev
```

## 数据说明

- 景点、年代和导览文本为 MVP mock 数据，主题围绕西湖十景、苏堤、白堤、雷峰塔、三潭印月、南屏晚钟等公开文化景观。
- 地图为项目内自绘的地形可视化 3D 导览图，不使用旅游地图截图和第三方瓦片。坐标与景点选择参考公开资料，并在地图视图保留 `© OpenStreetMap contributors` 标注。
- 公开素材库已放入 `public/assets/westlake/`，资料索引为 `public/assets/westlake/library.json`，前端同步使用 `src/westLakeAssets.js`。
- 素材来源包括 Wikimedia Commons 的西湖景观照片、1916 年《浙江名景胜迹西湖最新图》、李嵩《西湖图卷》，以及基于 OpenStreetMap 公开地理信息重绘的 `terrain-west-lake.svg`。
- 参考资料包括 UNESCO World Heritage Centre 的 West Lake Cultural Landscape of Hangzhou 页面、Wikidata/Wikimedia Commons 的 West Lake 条目和 OpenStreetMap 公开地理数据。

## 素材库范围

- 十一处导览节点：断桥残雪、白堤、平湖秋月、曲院风荷、苏堤春晓、花港观鱼、三潭印月、雷峰夕照、南屏晚钟、柳浪闻莺、湖滨晴雨。
- 两类历史素材：1916 年西湖地图、南宋李嵩《西湖图卷》。
- 一张地形可视化图：`terrain-west-lake.svg`，用于展示水体、山体、堤岸、岛屿和导览路线。

## 导览桌宠

- 桌宠全局常驻、可拖动，支持睡眠、气泡和聊天状态。
- 点击当前景点或地图节点后，桌宠会围绕当前上下文进行讲解。
- 当前接入远端导览接口时会优先请求服务端；接口不可用时会退回本地 mock 回答。
