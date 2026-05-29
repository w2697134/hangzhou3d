import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowUpRight,
  CircleDot,
  EyeOff,
  GalleryVerticalEnd,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  PackageOpen,
  Pause,
  Play,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X
} from 'lucide-react';
import * as THREE from 'three';
import './styles.css';
import { westLakeAssetsById } from './westLakeAssets.js';

const TAU = Math.PI * 2;
const SPHERE_RADIUS = 390;
const SPHERE_ROTATION_SPEED = 0.2;
const TIMELINE_CARD_SPACING = 116;
const TIMELINE_GROUP_START = 160;
const TIMELINE_GROUP_SPACING = 410;
const TIMELINE_END_APPROACH_OFFSET = 120;
const TIMELINE_GUIDE_LENGTH = 4700;
const TIMELINE_TRACK_START_Z = 820;
const TIMELINE_TRACK_LEAD = (TIMELINE_TRACK_START_Z - 230) / 1.02;
const TIMELINE_HOLDER_DROP = 10;
const LAYOUT_TRANSITION_DURATION = 1.35;
const TIMELINE_ORBIT_LIMIT = 0.52;
const TIMELINE_VIEW_SIDE_SCALE = 320;
const TIMELINE_VIEW_SIDE_LIMIT = 170;
const TIMELINE_FLASH_RATE = 2.7;
const TIMELINE_FLASH_SHARPNESS = 14;
const TIMELINE_MOVE_MAX_SPEED = 560;
const TIMELINE_MOVE_ACCEL_RESPONSE = 2.2;
const TIMELINE_MOVE_DECEL_RESPONSE = 5.6;
const POINTER_DRAG_DELAY_MS = 140;
const POINTER_DRAG_DISTANCE = 8;
const MAP_CLICK_MOVE_TOLERANCE = 16;
const PACKAGE_TRAY = {
  width: 150,
  depth: 92,
  wallThickness: 8,
  shelfHeight: 10,
  lipHeight: 18,
  frontLipHeight: 16,
  shelfZ: 6,
  rearZ: -40,
  frontZ: 52,
  labelZ: 56.5
};

const config = {
  title: '杭州西湖 3D 漫游',
  theme: {
    background: '#07110d',
    cyan: '#49d6c8',
    amber: '#e9b45f'
  }
};

const types = [
  { id: 'image', label: '图片', color: '#37ddeb' },
  { id: 'document', label: '文献', color: '#f2c464' },
  { id: 'video', label: '视频', color: '#f7fbff' },
  { id: 'object', label: '物件', color: '#ff8c4e' },
  { id: 'audio', label: '声音', color: '#a86bff' },
  { id: 'map', label: '地图', color: '#74d36d' }
];

const typeMap = Object.fromEntries(types.map(type => [type.id, type]));
const assetImageCache = new Map();

const XIANGDONG_MAP_SIZE = { width: 1800, height: 1990 };
const XIANGDONG_MAP_BASE_Y = 34;
const XIANGDONG_MAP_DEFAULT_ZOOM = 0.86;
const XIANGDONG_MAP_MIN_ZOOM = 0.82;
const XIANGDONG_MAP_MAX_ZOOM = 1.62;
const XIANGDONG_MAP_VIEW_SIZE = { width: 1900, height: 1080 };
const XIANGDONG_MAP_PAN_MARGIN = 18;
const XIANGDONG_GEO_BOUNDS = {
  minLat: 30.224,
  maxLat: 30.266,
  minLon: 120.116,
  maxLon: 120.169
};

const xiangdongRouteGeoStops = [
  { id: 'duanqiao', label: '断桥残雪', meta: '白堤东端', lat: 30.2602, lon: 120.1536 },
  { id: 'baidi', label: '白堤', meta: '湖上长堤', lat: 30.2573, lon: 120.1482 },
  { id: 'pinghu', label: '平湖秋月', meta: '北里湖畔', lat: 30.2552, lon: 120.1451 },
  { id: 'quyuan', label: '曲院风荷', meta: '荷风酒香', lat: 30.2514, lon: 120.1352 },
  { id: 'shuangfeng', label: '双峰插云', meta: '南北高峰', lat: 30.2499, lon: 120.1181 },
  { id: 'sudi', label: '苏堤春晓', meta: '南北长堤', lat: 30.2424, lon: 120.1395 },
  { id: 'huagang', label: '花港观鱼', meta: '花港园林', lat: 30.2309, lon: 120.1391 },
  { id: 'santan', label: '三潭印月', meta: '湖中三塔', lat: 30.2351, lon: 120.1495 },
  { id: 'leifeng', label: '雷峰夕照', meta: '南屏山麓', lat: 30.2316, lon: 120.1484 },
  { id: 'nanping', label: '南屏晚钟', meta: '净慈寺钟声', lat: 30.2268, lon: 120.1472 },
  { id: 'liulang', label: '柳浪闻莺', meta: '湖东园景', lat: 30.2422, lon: 120.1602 },
  { id: 'hubin', label: '湖滨晴雨', meta: '城市湖岸', lat: 30.2551, lon: 120.1646 }
];

const xiangdongRouteStops = xiangdongRouteGeoStops.map(stop => ({
  ...stop,
  ...projectXiangdongGeo(stop.lat, stop.lon)
}));

const locations = xiangdongRouteStops
  .map(({ id, label, x, y }) => ({ id, label, x, y }));

function projectXiangdongGeo(lat, lon) {
  const lonRange = XIANGDONG_GEO_BOUNDS.maxLon - XIANGDONG_GEO_BOUNDS.minLon;
  const latRange = XIANGDONG_GEO_BOUNDS.maxLat - XIANGDONG_GEO_BOUNDS.minLat;
  const normalizedLon = (lon - XIANGDONG_GEO_BOUNDS.minLon) / lonRange - 0.5;
  const normalizedLat = (lat - XIANGDONG_GEO_BOUNDS.minLat) / latRange - 0.5;
  return {
    x: normalizedLon * XIANGDONG_MAP_SIZE.width * 0.78,
    y: normalizedLat * XIANGDONG_MAP_SIZE.height * 0.82
  };
}

const exhibitSeeds = [
  { title: '断桥残雪', type: 'image', year: 1699, locationId: 'duanqiao', author: '西湖十景', material: '湖桥景观', description: '白堤东端的断桥因冬雪初霁最有辨识度，是西湖叙事里连接城与湖的入口。', tags: ['十景', '白堤', '冬景'] },
  { title: '白堤漫步', type: 'map', year: 822, locationId: 'baidi', author: '白居易线索', material: '堤岸路线', description: '白堤把孤山与湖滨连成一条开阔步行线，适合用来理解西湖北岸的空间秩序。', tags: ['白堤', '唐代', '路线'] },
  { title: '平湖秋月', type: 'image', year: 1699, locationId: 'pinghu', author: '西湖十景', material: '观景平台', description: '平湖秋月强调静水、远山和月色的关系，是西湖“借景入画”的代表场景。', tags: ['十景', '月色', '孤山'] },
  { title: '曲院风荷', type: 'image', year: 1699, locationId: 'quyuan', author: '西湖十景', material: '荷塘园景', description: '曲院风荷以夏日荷香和水岸曲折见长，适合串联植物、园林和湖面视线。', tags: ['十景', '荷花', '夏景'] },
  { title: '双峰插云', type: 'image', year: 1699, locationId: 'shuangfeng', author: '西湖十景', material: '山色云气', description: '双峰插云把南高峰、北高峰和雨后云雾放在同一条视线里，重点不是单个亭碑，而是西湖西侧群山的天际线。', tags: ['十景', '南北高峰', '云气'] },
  { title: '苏堤春晓', type: 'map', year: 1089, locationId: 'sudi', author: '苏轼线索', material: '湖上长堤', description: '苏堤由疏浚西湖而来，南北贯穿湖面，六桥与春柳共同塑造了经典漫游节奏。', tags: ['苏堤', '宋代', '春景'] },
  { title: '花港观鱼', type: 'image', year: 1699, locationId: 'huagang', author: '西湖十景', material: '园林水池', description: '花港观鱼把花木、池水和游鱼组合成近距离观看的园林场景。', tags: ['十景', '园林', '游鱼'] },
  { title: '三潭印月', type: 'object', year: 1089, locationId: 'santan', author: '苏轼线索', material: '湖中石塔', description: '三座石塔立在小瀛洲南侧水面，月夜灯影让湖面形成“水中有月”的想象。', tags: ['三潭', '小瀛洲', '月景'] },
  { title: '雷峰夕照', type: 'object', year: 977, locationId: 'leifeng', author: '吴越国线索', material: '塔与遗址', description: '雷峰塔位于西湖南岸，夕阳下的塔影与民间传说共同构成强烈的文化记忆。', tags: ['雷峰塔', '夕照', '传说'] },
  { title: '南屏晚钟', type: 'audio', year: 954, locationId: 'nanping', author: '净慈寺线索', material: '钟声声景', description: '南屏晚钟把寺院钟声、山体回响和湖面暮色连在一起，是声音进入景观的典型例子。', tags: ['净慈寺', '钟声', '声景'] },
  { title: '柳浪闻莺', type: 'audio', year: 1699, locationId: 'liulang', author: '西湖十景', material: '柳岸声景', description: '湖东柳岸以春柳和鸟鸣见长，适合作为城市边界与自然体验之间的过渡站。', tags: ['十景', '柳岸', '春景'] },
  { title: '湖滨晴雨', type: 'video', year: 1913, locationId: 'hubin', author: '近代湖滨线索', material: '城市湖岸', description: '湖滨把西湖与杭州城市生活直接接上，晴雨变化会让同一湖岸呈现不同情绪。', tags: ['湖滨', '城市', '近代'] },
  { title: '孤山与西泠', type: 'document', year: 1904, locationId: 'pinghu', author: '西泠印社线索', material: '文人社群', description: '孤山一带承载金石、书画和文人雅集，说明西湖不只是自然景观，也是文化社交场。', tags: ['孤山', '西泠', '文人'] },
  { title: '岳湖远眺', type: 'image', year: 1221, locationId: 'quyuan', author: '南宋线索', material: '湖山视线', description: '从北西湖望向湖面与群山，可以看到南宋以来“城、湖、山”并置的空间格局。', tags: ['南宋', '湖山', '视线'] },
  { title: '苏堤六桥', type: 'object', year: 1089, locationId: 'sudi', author: '苏轼线索', material: '桥梁节点', description: '苏堤上的六座桥把长线步行拆成有停顿的节奏，也让游客不断改变看湖角度。', tags: ['苏堤', '桥', '路线'] },
  { title: '小瀛洲水院', type: 'map', year: 1607, locationId: 'santan', author: '明代园林线索', material: '湖中岛园', description: '小瀛洲以“湖中有岛、岛中有湖”的格局组织空间，是西湖人工岛园的重要节点。', tags: ['小瀛洲', '岛园', '明代'] },
  { title: '雷峰塔遗址重建', type: 'document', year: 2002, locationId: 'leifeng', author: '保护更新线索', material: '遗址展示', description: '新塔在遗址保护的基础上重建，适合讨论历史建筑如何在当代继续被观看。', tags: ['雷峰塔', '遗址', '保护'] },
  { title: '净慈寺钟楼', type: 'audio', year: 1986, locationId: 'nanping', author: '声景复原线索', material: '钟楼与山谷', description: '钟声并不是单一物件，它依赖寺院、山体和湖面共同形成可感知的空间。', tags: ['净慈寺', '钟楼', '声景'] },
  { title: '湖东柳岸', type: 'video', year: 1949, locationId: 'liulang', author: '城市公园线索', material: '公园岸线', description: '柳浪闻莺一带展示了西湖东岸从城市边缘到公共游憩空间的转变。', tags: ['柳浪闻莺', '公园', '城市'] },
  { title: '白堤与孤山水线', type: 'map', year: 1911, locationId: 'baidi', author: '近代测绘线索', material: '湖岸测绘', description: '白堤所在的北湖岸线把步行、观景和历史建筑串成一条很清楚的游线。', tags: ['白堤', '孤山', '测绘'] },
  { title: '断桥传说', type: 'document', year: 1926, locationId: 'duanqiao', author: '民间故事线索', material: '白蛇传文本', description: '断桥因白蛇传而具有情节性，游客到这里常常不是只看桥，也在进入故事现场。', tags: ['断桥', '白蛇传', '故事'] },
  { title: '湖心亭眺望', type: 'image', year: 1552, locationId: 'santan', author: '明代线索', material: '湖中亭台', description: '湖心亭让人从湖心反看四周山水，改变了常规从岸边看湖的方式。', tags: ['湖心亭', '岛屿', '视角'] },
  { title: '苏轼疏浚西湖', type: 'document', year: 1089, locationId: 'sudi', author: '北宋治理线索', material: '治水叙事', description: '苏堤背后是一次水利治理与景观塑造的重叠：清淤、筑堤、通行和观景同时发生。', tags: ['苏轼', '治水', '宋代'] },
  { title: '白居易治湖线索', type: 'document', year: 822, locationId: 'baidi', author: '唐代治理线索', material: '地方治理', description: '白居易在杭州任职时整治湖堤水利，这条线索帮助理解西湖如何被持续维护。', tags: ['白居易', '唐代', '水利'] },
  { title: '西湖申遗', type: 'document', year: 2011, locationId: 'hubin', author: '世界遗产线索', material: '遗产文本', description: '2011 年西湖文化景观列入世界遗产，核心价值在于湖山、堤岛、寺塔和诗性观景的整体关系。', tags: ['世界遗产', '保护', '当代'] },
  { title: '花港牡丹亭', type: 'image', year: 1952, locationId: 'huagang', author: '园林更新线索', material: '园林建筑', description: '花港一带的亭、廊、池让游览从湖面大景转向近身园林体验。', tags: ['花港观鱼', '亭廊', '园林'] },
  { title: '曲院荷风水面', type: 'video', year: 1983, locationId: 'quyuan', author: '景区更新线索', material: '荷塘影像', description: '荷塘随季节改变，是最适合用动态影像表现的西湖场景之一。', tags: ['曲院风荷', '荷塘', '季节'] },
  { title: '两峰插云图像', type: 'document', year: 1221, locationId: 'shuangfeng', author: '叶肖岩线索', material: '宋代画意', description: '叶肖岩《西湖十景图》里的两峰插云把山峰藏进云气之中，可用来解释“看不完整反而更有想象”的古典观景方式。', tags: ['双峰插云', '宋画', '十景'] },
  { title: '雷峰塔与白蛇传', type: 'document', year: 1924, locationId: 'leifeng', author: '近代记忆线索', material: '传说与遗址', description: '雷峰塔倒塌后仍在文学和民间故事里持续存在，说明景点的意义不只来自建筑实体。', tags: ['雷峰塔', '白蛇传', '记忆'] },
  { title: '南线夜游', type: 'video', year: 2024, locationId: 'nanping', author: '当代游线', material: '夜景影像', description: '南线夜游把雷峰塔、净慈寺和湖面灯影组织起来，适合作为一天游程的收束。', tags: ['夜游', '南线', '路线'] },
  { title: '湖滨步行街', type: 'map', year: 2020, locationId: 'hubin', author: '城市更新线索', material: '公共空间', description: '湖滨步行街让游客从城市街区自然进入湖岸，也让西湖成为杭州日常生活的一部分。', tags: ['湖滨', '步行街', '当代'] },
  { title: '十景游线总览', type: 'map', year: 1699, locationId: 'duanqiao', author: '清代题名线索', material: '游线索引', description: '从断桥出发串联白堤、苏堤、三潭、雷峰和南屏，可以形成一条完整的西湖十景导览线。', tags: ['十景', '总览', '路线'] }
];

const items = exhibitSeeds.map((seed, index) => {
  const type = typeMap[seed.type] || types[index % types.length];
  const year = seed.year;
  const month = (index * 5) % 12 + 1;
  const day = (index * 11) % 27 + 1;
  const location = locations.find(entry => entry.id === seed.locationId) || locations[index % locations.length];
  const angle = index * 2.3999632297;
  const radius = 145 + ((index * 43) % 160);
  const elevation = -150 + ((index * 79) % 310);

  return {
    id: `obj-${String(index + 1).padStart(3, '0')}`,
    title: seed.title,
    type: type.id,
    typeLabel: type.label,
    year,
    month,
    day,
    dateLabel: `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`,
    location,
    author: seed.author,
    material: seed.material,
    description: seed.description,
    tags: seed.tags,
    assetId: seed.assetId || getDefaultSeedAssetId(seed),
    position: new THREE.Vector3(
      Math.cos(angle) * radius,
      elevation,
      Math.sin(angle) * radius * 0.72
    )
  };
});

const GUIDE_PET_NAME = '小杭';
const MAX_GUIDE_HISTORY_MESSAGES = 12;
const MAX_GUIDE_MESSAGE_LENGTH = 900;
const READABLE_TYPE_LABELS = {
  image: '图片',
  document: '文献',
  video: '影像',
  object: '实物',
  audio: '声音',
  map: '地图'
};
const READABLE_MAP_LABELS = {
  duanqiao: '断桥残雪',
  baidi: '白堤',
  pinghu: '平湖秋月',
  quyuan: '曲院风荷',
  shuangfeng: '双峰插云',
  sudi: '苏堤春晓',
  huagang: '花港观鱼',
  santan: '三潭印月',
  leifeng: '雷峰夕照',
  nanping: '南屏晚钟',
  liulang: '柳浪闻莺',
  hubin: '湖滨晴雨'
};

function getCurrentExhibit({ selectedItem, mapLocationId, timelineGroupId, items: layoutItems }) {
  if (selectedItem) {
    return {
      kind: 'item',
      id: selectedItem.id,
      name: getExhibitDisplayName(selectedItem),
      item: selectedItem,
      items: [selectedItem]
    };
  }

  if (mapLocationId) {
    const stop = getMapStopById(mapLocationId);
    const locationItems = getMapLocationItems(layoutItems, mapLocationId);
    return {
      kind: 'location',
      id: mapLocationId,
      name: getReadableLocationName(stop || { id: mapLocationId }),
      location: stop,
      item: locationItems[0] || null,
      items: locationItems
    };
  }

  if (timelineGroupId) {
    const group = getTimelineGroups(layoutItems).find(entry => entry.id === timelineGroupId);
    return {
      kind: 'timeline',
      id: timelineGroupId,
      name: group?.label || timelineGroupId,
      group,
      item: group?.items?.[0] || null,
      items: group?.items || []
    };
  }

  return null;
}

function getExhibitInfo(exhibit) {
  if (!exhibit) {
    return {
      summary: '先点一个景点或展品，我可以帮你讲解。',
      detail: '先在 3D 空间、年表或地图节点里选中一个对象，我会围绕西湖当前地点讲解。'
    };
  }

  const primaryItem = exhibit.item || exhibit.items?.[0] || null;
  const count = exhibit.items?.length || 0;
  const locationName = primaryItem ? getReadableLocationName(primaryItem.location) : getReadableLocationName(exhibit.location);
  const typeLabel = primaryItem ? getReadableTypeName(primaryItem.type) : '展项';
  const yearText = primaryItem?.dateLabel || (primaryItem?.year ? `${primaryItem.year}` : '这段线索');

  if (exhibit.kind === 'location') {
    return {
      summary: `这里是「${exhibit.name}」，当前关联 ${count || 1} 条导览内容。它适合作为西湖路线里的一个停靠点，可以从景观、时间和下一站三条线索来理解。`,
      detail: `「${exhibit.name}」把湖岸、堤岛或寺塔的线索聚到一起。你可以先看「${primaryItem ? getExhibitDisplayName(primaryItem) : '地图节点'}」，再顺着西湖游线继续往下走。`
    };
  }

  if (exhibit.kind === 'timeline') {
    const years = exhibit.items.map(item => item.year).filter(Boolean);
    const firstYear = Math.min(...years);
    const lastYear = Math.max(...years);
    const range = years.length ? `${firstYear} 到 ${lastYear}` : exhibit.name;
    return {
      summary: `「${exhibit.name}」里聚合了 ${count} 条西湖线索，时间跨度约为 ${range}。`,
      detail: `这一组适合按时间顺序浏览：先看西湖如何被治理、题名和保护，再看这些变化如何落到具体景点上。`
    };
  }

  return {
    summary: `这是「${exhibit.name}」，一条 ${typeLabel} 导览线索，时间落在 ${yearText}，地点指向「${locationName}」。`,
    detail: `「${exhibit.name}」可以先看它呈现的景观，再看时间标记 ${yearText}，最后和「${locationName}」这段西湖路线联系起来。`
  };
}

function searchTimeline(exhibit) {
  if (!exhibit) return '先点一个景点或展品，我可以帮你讲解。';
  const primaryItem = exhibit.item || exhibit.items?.[0] || null;
  if (exhibit.kind === 'timeline') {
    const years = exhibit.items.map(item => item.year).filter(Boolean);
    if (!years.length) return `「${exhibit.name}」目前还没有可用的时间标记。`;
    return `「${exhibit.name}」集中在 ${Math.min(...years)} 到 ${Math.max(...years)} 之间，共有 ${exhibit.items.length} 条线索，可以按年代顺着看。`;
  }
  if (!primaryItem) return `「${exhibit.name}」目前更像一个地点节点，可以先从路线和周边景观理解。`;
  return `「${exhibit.name}」的时间标记是 ${primaryItem.dateLabel || primaryItem.year}。在这条西湖漫游线里，它适合和同地点或相邻年代的内容一起看。`;
}

function recommendRoute(exhibit, layoutItems) {
  if (!exhibit) return '先点一个景点或展品，我可以帮你讲解。';

  if (exhibit.kind === 'location' && exhibit.location) {
    const currentIndex = xiangdongRouteStops.findIndex(stop => stop.id === exhibit.location.id);
    const nextStop = xiangdongRouteStops[currentIndex + 1] || xiangdongRouteStops[0];
    return `下一站可以去「${getReadableLocationName(nextStop)}」。它会把「${exhibit.name}」的湖岸或堤岛线索继续往后推进。`;
  }

  const primaryItem = exhibit.item || exhibit.items?.[0] || null;
  const orderedItems = [...layoutItems].sort((a, b) => a.year - b.year || getItemNumber(a) - getItemNumber(b));
  const currentIndex = primaryItem ? orderedItems.findIndex(item => item.id === primaryItem.id) : -1;
  const nextItem = orderedItems[currentIndex + 1] || orderedItems[0];
  if (!nextItem) return '当前没有更多导览内容可以推荐。';
  return `下一站可以看「${getExhibitDisplayName(nextItem)}」，它和「${exhibit.name}」在时间或路线位置上相邻，适合继续追问。`;
}

function createGuideAnswer(exhibit, question, layoutItems) {
  const normalized = question.trim().toLowerCase();
  const info = getExhibitInfo(exhibit);
  if (!exhibit) return info.summary;

  if (/什么时候|时间|年代|发生|when|date/.test(normalized)) {
    return searchTimeline(exhibit, question);
  }

  if (/下一站|去哪|路线|继续|next|route/.test(normalized)) {
    return recommendRoute(exhibit, layoutItems);
  }

  if (/讲了什么|这张图|图|内容|是什么|看点|what/.test(normalized)) {
    return info.detail;
  }

  return `围绕「${exhibit.name}」来看，${info.summary} 你的问题可以先落到它的时间、地点和相邻景点上，我会尽量只围绕西湖当前内容回答。`;
}

function cleanGuideContent(content) {
  return String(content ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_GUIDE_MESSAGE_LENGTH);
}

function createGuideChatHistory(history = []) {
  return history
    .filter(message => message?.role === 'user' || message?.role === 'pet')
    .map(message => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: cleanGuideContent(message.text)
    }))
    .filter(message => message.content)
    .slice(-MAX_GUIDE_HISTORY_MESSAGES);
}

async function readGuideResponsePayload(response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }
    return { error: await response.text() };
  } catch {
    return {};
  }
}

function createGuideRequestPayload(exhibit, question, layoutItems, history = []) {
  if (!exhibit) return null;
  const info = getExhibitInfo(exhibit);
  const primaryItem = exhibit.item || exhibit.items?.[0] || null;
  return {
    question,
    exhibit: {
      kind: exhibit.kind,
      id: exhibit.id,
      name: exhibit.name,
      summary: info.summary,
      detail: info.detail,
      timeline: searchTimeline(exhibit),
      route: recommendRoute(exhibit, layoutItems),
      item: primaryItem
        ? {
            id: primaryItem.id,
            name: getExhibitDisplayName(primaryItem),
            type: getReadableTypeName(primaryItem.type),
            dateLabel: primaryItem.dateLabel,
            year: primaryItem.year,
            location: getReadableLocationName(primaryItem.location),
            material: primaryItem.material,
            description: primaryItem.description
          }
        : null,
      relatedItems: (exhibit.items || []).slice(0, 6).map(item => ({
        id: item.id,
        name: getExhibitDisplayName(item),
        dateLabel: item.dateLabel,
        location: getReadableLocationName(item.location)
      }))
    },
    history: createGuideChatHistory(history)
  };
}

async function requestGuideAnswer(exhibit, question, layoutItems, history = []) {
  const fallback = createGuideAnswer(exhibit, question, layoutItems);
  const payload = createGuideRequestPayload(exhibit, question, layoutItems, history);
  if (!payload || typeof fetch !== 'function') return fallback;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch('/api/3dzhanlan-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await readGuideResponsePayload(response);
    if (!response.ok) return fallback;
    const rawAnswer = data && typeof data === 'object' && typeof data.answer === 'string' ? data.answer : data?.content;
    const answer = typeof rawAnswer === 'string' ? rawAnswer.trim() : '';
    return answer || fallback;
  } catch {
    return fallback;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getGuideOpeningMessages(exhibit) {
  const info = getExhibitInfo(exhibit);
  return [{ role: 'pet', text: info.summary }];
}

function getExhibitDisplayName(item) {
  if (!item) return '当前景点';
  return getReadableLocationName(item.location) || item.title || '当前景点';
}

function getFocusCardImageLabel(item, asset) {
  return asset?.title || item?.title || getReadableLocationName(item?.location);
}

function getReadableTypeName(typeId) {
  return READABLE_TYPE_LABELS[typeId] || '展项';
}

function getReadableLocationName(location) {
  if (!location) return '当前地点';
  return READABLE_MAP_LABELS[location.id] || location.label || '当前地点';
}

function getDefaultSeedAssetId(seed) {
  const title = seed.title || '';
  if (title.includes('两峰插云图像')) return 'shuangfeng-scroll';
  if (title.includes('总览') || title.includes('申遗')) return 'west-lake-area-map';
  if (title.includes('测绘') || title.includes('水院') || title.includes('白居易')) return 'historic-map-1916';
  if (title.includes('西泠') || title.includes('远眺') || title.includes('苏轼') || title.includes('白蛇传') || title.includes('湖心亭')) return 'westlake-scroll';
  return seed.locationId;
}

function getItemAsset(item) {
  if (!item) return null;
  return westLakeAssetsById[item.assetId]
    || westLakeAssetsById[item.location?.id]
    || westLakeAssetsById['west-lake-area-map']
    || null;
}

function getLoadedAssetImage(asset) {
  const entry = asset ? assetImageCache.get(asset.src) : null;
  return entry?.status === 'loaded' ? entry.image : null;
}

function requestAssetImage(asset, onLoad) {
  if (!asset?.src || typeof Image === 'undefined') return null;
  const cached = assetImageCache.get(asset.src);
  if (cached?.status === 'loaded') return cached.image;
  if (cached?.status === 'loading') {
    if (onLoad) cached.listeners.add(onLoad);
    return null;
  }
  if (cached?.status === 'error') return null;

  const image = new Image();
  const entry = {
    status: 'loading',
    image: null,
    listeners: new Set(onLoad ? [onLoad] : [])
  };
  assetImageCache.set(asset.src, entry);
  image.onload = () => {
    entry.status = 'loaded';
    entry.image = image;
    entry.listeners.forEach(listener => listener(image));
    entry.listeners.clear();
  };
  image.onerror = () => {
    entry.status = 'error';
    entry.listeners.clear();
  };
  image.src = asset.src;
  return null;
}

function drawImageCover(ctx, image, x, y, w, h) {
  const sourceWidth = image.naturalWidth || image.width || w;
  const sourceHeight = image.naturalHeight || image.height || h;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;
  if (sourceRatio > targetRatio) {
    sw = sourceHeight * targetRatio;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetRatio;
    sy = (sourceHeight - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h);
}

function getAppPage(defaultToPackageLab = false) {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/package-lab' || (defaultToPackageLab && path === '')) return 'package-lab';
  return 'experience';
}

function App() {
  const experienceRef = useRef(null);
  const immersiveRef = useRef(false);
  const [page, setPage] = useState(() => getAppPage(false));
  const initialLayout = useMemo(() => {
    const layout = new URLSearchParams(window.location.search).get('layout');
    return ['overview', 'timeline', 'map'].includes(layout) ? layout : 'overview';
  }, []);
  const [selectedId, setSelectedId] = useState('obj-001');
  const [focusOpen, setFocusOpen] = useState(false);
  const [touring, setTouring] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [activeLayout, setActiveLayout] = useState(initialLayout);
  const [timelineGroupId, setTimelineGroupId] = useState(null);
  const [mapLocationId, setMapLocationId] = useState(null);

  const navigateTo = path => {
    window.history.pushState({}, '', path);
    setPage(getAppPage(false));
  };

  useEffect(() => {
    const onPopState = () => {
      setPage(getAppPage(false));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    immersiveRef.current = isImmersive;
  }, [isImmersive]);

  useEffect(() => {
    const updateFullscreenState = () => {
      const fullscreenElement = document.fullscreenElement;
      setFullscreenSupported(Boolean(document.fullscreenEnabled));
      setIsFullscreen(Boolean(fullscreenElement));
      if (!fullscreenElement && immersiveRef.current) {
        immersiveRef.current = false;
        setIsImmersive(false);
      }
    };

    updateFullscreenState();
    document.addEventListener('fullscreenchange', updateFullscreenState);
    return () => document.removeEventListener('fullscreenchange', updateFullscreenState);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setAppliedQuery(query);
    }, 160);
    return () => window.clearTimeout(handle);
  }, [query]);

  const visibleItems = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      [item.title, item.typeLabel, item.author, item.material, item.location.label, ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [appliedQuery]);

  const selected = visibleItems.find(item => item.id === selectedId) || visibleItems[0] || items[0];

  useEffect(() => {
    if (!visibleItems.some(item => item.id === selectedId) && visibleItems[0]) {
      setSelectedId(visibleItems[0].id);
    }
  }, [selectedId, visibleItems]);

  const selectedIndex = Math.max(0, visibleItems.findIndex(item => item.id === selected?.id));
  const guideContext = useMemo(() => getCurrentExhibit({
    selectedItem: focusOpen ? selected : null,
    mapLocationId: activeLayout === 'map' ? mapLocationId : null,
    timelineGroupId: activeLayout === 'timeline' ? timelineGroupId : null,
    items: visibleItems
  }), [activeLayout, focusOpen, mapLocationId, selected, timelineGroupId, visibleItems]);

  const focusOffset = offset => {
    if (!visibleItems.length) return;
    const nextIndex = (selectedIndex + offset + visibleItems.length) % visibleItems.length;
    setSelectedId(visibleItems[nextIndex].id);
    setFocusOpen(true);
  };

  const closeFocusedCard = () => {
    setFocusOpen(false);
  };

  const changeLayout = nextLayout => {
    if (nextLayout === activeLayout) return;
    closeFocusedCard();
    setActiveLayout(nextLayout);
    if (nextLayout !== 'timeline') setTimelineGroupId(null);
    if (nextLayout !== 'map') setMapLocationId(null);
  };

  const requestExperienceFullscreen = async () => {
    if (!fullscreenSupported) return;
    try {
      if (!document.fullscreenElement) {
        await (experienceRef.current || document.documentElement).requestFullscreen();
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  const exitExperienceFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await exitExperienceFullscreen();
    else await requestExperienceFullscreen();
  };

  const enterImmersive = () => {
    setIsImmersive(true);
  };

  const exitImmersive = () => {
    setIsImmersive(false);
  };

  const toggleImmersive = () => {
    if (isImmersive) exitImmersive();
    else enterImmersive();
  };

  useEffect(() => {
    const onKeyDown = event => {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') return;
      if (event.key === 'Escape' && isImmersive) {
        exitImmersive();
        return;
      }
      if (event.key.toLowerCase() === 'h') {
        if (isImmersive) exitImmersive();
        else if (document.fullscreenElement) enterImmersive();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isImmersive]);

  if (page === 'package-lab') {
    return (
      <PackagingLab
        items={visibleItems}
        onBack={() => navigateTo('/?layout=timeline')}
      />
    );
  }

  return (
    <main
      className={`experience ${isFullscreen ? 'is-fullscreen' : ''} ${isImmersive ? 'is-immersive' : ''}`}
      ref={experienceRef}
      onDoubleClick={() => {
        if (isImmersive) exitImmersive();
      }}
    >
      <SpaceScene
        items={visibleItems}
        selectedId={focusOpen ? selected?.id : null}
        immersive={isImmersive}
        onSelect={id => {
          setSelectedId(id);
          setFocusOpen(true);
        }}
        touring={touring}
        activeLayout={activeLayout}
        timelineGroupId={activeLayout === 'timeline' ? timelineGroupId : null}
        onTimelineGroupSelect={groupId => setTimelineGroupId(groupId)}
        onTimelineGroupClear={() => setTimelineGroupId(null)}
        mapLocationId={activeLayout === 'map' ? mapLocationId : null}
        onMapLocationSelect={locationId => {
          setMapLocationId(locationId);
          setFocusOpen(false);
          const firstItem = getMapItemForLocation(visibleItems, locationId);
          if (firstItem) setSelectedId(firstItem.id);
        }}
        onMapLocationClear={() => setMapLocationId(null)}
      />

      {!isImmersive && !isFullscreen ? (
        <header className="topline">
          <div className="brand">
            <div className="brand-orbit"><span /></div>
            <div>
              <h1>{config.title}</h1>
            </div>
          </div>
          <div className="top-actions">
            <label className="search">
              <Search size={16} />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索景点、故事、地点" />
            </label>
            <button
              className={`start ${touring ? 'is-active' : ''}`}
              type="button"
              onClick={() => setTouring(!touring)}
              aria-label={touring ? '暂停' : '开始'}
              title={touring ? '暂停' : '开始'}
            >
              {touring ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </header>
      ) : null}

      {!isImmersive ? (
        <LayoutDock activeLayout={activeLayout} onLayoutChange={changeLayout} compact={isFullscreen} />
      ) : null}

      {!isFullscreen ? (
        <FullscreenEntryControl
          fullscreenSupported={fullscreenSupported}
          onEnterFullscreen={toggleFullscreen}
        />
      ) : null}

      {!isImmersive && isFullscreen ? (
        <FullscreenHud
          query={query}
          onQueryChange={setQuery}
          touring={touring}
          onToggleTouring={() => setTouring(value => !value)}
        />
      ) : null}

      {isFullscreen ? (
        <FullscreenControls
          isImmersive={isImmersive}
          onToggleImmersive={toggleImmersive}
          onExitFullscreen={toggleFullscreen}
        />
      ) : null}

      {focusOpen ? (
        <FocusCard
          item={selected}
          onPrevious={() => focusOffset(-1)}
          onNext={() => focusOffset(1)}
          onClose={closeFocusedCard}
        />
      ) : null}

      {activeLayout === 'map' && !isImmersive ? (
        <p className="map-credit">真实地形图素材</p>
      ) : null}

      <GuidePet context={guideContext} items={visibleItems} />
    </main>
  );
}

function PackagingLab({ items, onBack }) {
  const sampleItems = useMemo(() => items.slice(0, 7), [items]);
  const [expanded, setExpanded] = useState(true);
  const [settings, setSettings] = useState({
    slotOffset: 0,
    stackGap: 0,
    insertDepth: 18,
    tilt: 0,
    fan: 70,
    guardHeight: 76
  });

  const updateSetting = (key, value) => {
    setSettings(current => ({ ...current, [key]: Number(value) }));
  };

  const resetSettings = () => {
    setSettings({
      slotOffset: 0,
      stackGap: 0,
      insertDepth: 18,
      tilt: 0,
      fan: 70,
      guardHeight: 76
    });
    setExpanded(true);
  };

  return (
    <main className="package-page">
      <header className="package-topbar">
        <button className="package-back" type="button" onClick={onBack}>
          <ArrowLeft size={18} />
          返回时序
        </button>
        <div className="package-title">
          <PackageOpen size={20} />
          <h1>封装卡片调试</h1>
        </div>
        <div className="package-mode" role="group" aria-label="封装状态">
          <button
            className={!expanded ? 'is-active' : ''}
            type="button"
            onClick={() => setExpanded(false)}
          >
            折叠
          </button>
          <button
            className={expanded ? 'is-active' : ''}
            type="button"
            onClick={() => setExpanded(true)}
          >
            展开
          </button>
        </div>
      </header>

      <section className="package-workbench">
        <div className="package-stage" aria-label="封装预览">
          <PackageLabViewport items={sampleItems} expanded={expanded} settings={settings} />
        </div>

        <aside className="package-controls" aria-label="封装参数">
          <div className="package-controls__head">
            <SlidersHorizontal size={18} />
            <h2>封装参数</h2>
          </div>
          <PackageSlider
            label="卡堆横向"
            value={settings.slotOffset}
            min="-70"
            max="70"
            step="1"
            onChange={value => updateSetting('slotOffset', value)}
          />
          <PackageSlider
            label="卡片间距"
            value={settings.stackGap}
            min="0"
            max="28"
            step="1"
            onChange={value => updateSetting('stackGap', value)}
          />
          <PackageSlider
            label="插入深度"
            value={settings.insertDepth}
            min="0"
            max="42"
            step="1"
            onChange={value => updateSetting('insertDepth', value)}
          />
          <PackageSlider
            label="折叠倾角"
            value={settings.tilt}
            min="-18"
            max="18"
            step="1"
            onChange={value => updateSetting('tilt', value)}
          />
          <PackageSlider
            label="展开扇距"
            value={settings.fan}
            min="48"
            max="112"
            step="1"
            onChange={value => updateSetting('fan', value)}
          />
          <PackageSlider
            label="前挡高度"
            value={settings.guardHeight}
            min="42"
            max="92"
            step="1"
            onChange={value => updateSetting('guardHeight', value)}
          />
          <button className="package-reset" type="button" onClick={resetSettings}>
            <RotateCcw size={16} />
            重置
          </button>
        </aside>
      </section>
    </main>
  );
}

function PackageLabViewport({ items, expanded, settings }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x02050a, 420, 980);

    const camera = new THREE.OrthographicCamera(-210, 210, 150, -150, 0.1, 1400);
    camera.position.set(0, 132, 320);
    camera.lookAt(0, 62, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x9bdcff, 1.2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xd8ffff, 2.2);
    key.position.set(120, 220, 180);
    scene.add(key);
    const cyan = new THREE.PointLight(0x28f4ff, 4.5, 460);
    cyan.position.set(-120, 80, 120);
    scene.add(cyan);

    const packageRoot = new THREE.Group();
    scene.add(packageRoot);

    const floor = createPackageFloorGlowObject({ namePrefix: 'package' });
    packageRoot.add(floor);

    const dock = createPackageReferenceDockObject({
      labelText: String(items[0]?.year ?? 822),
      expanded,
      guardHeight: settings.guardHeight,
      namePrefix: 'package-lab'
    });
    const trayGlow = dock.userData.trayGlow;
    const hoverGlow = dock.userData.hoverGlow;
    packageRoot.add(dock);

    const cardsGroup = new THREE.Group();
    cardsGroup.name = 'floating-card-set';
    const cardFloatPhase = seeded('package-lab-card-set', 211) * TAU;
    packageRoot.add(cardsGroup);

    const visibleStack = items.slice(0, expanded ? 4 : 6);
    [...visibleStack].reverse().forEach((item, reversedIndex) => {
      const layer = visibleStack.length - 1 - reversedIndex;
      const isMain = layer === 0;
      const x = settings.slotOffset * 0.16 + layer * (settings.stackGap * 0.12 + settings.fan * 0.035 + 2.8);
      const y = (expanded ? 92 : 78) - settings.insertDepth * (expanded ? 0.08 : 0.18) + layer * 0.7;
      const z = (expanded ? 38 : 34) - layer * (expanded ? 4.6 : 3.4);
      const card = createPackageCard(item);
      card.position.set(x, y, z);
      card.rotation.x = THREE.MathUtils.degToRad(expanded ? -1.6 : -0.8);
      card.rotation.y = THREE.MathUtils.degToRad(expanded ? -5.2 - layer * 0.8 : -3.4 - layer * 0.5);
      card.rotation.z = THREE.MathUtils.degToRad((expanded ? -1.4 : 0.4) + layer * 1.05 + settings.tilt * 0.12);
      const scale = (expanded ? 1.04 : 0.88) - layer * 0.018;
      card.scale.setScalar(scale);
      card.traverse(child => {
        child.renderOrder = isMain ? 980 : 880 - layer;
      });
      cardsGroup.add(card);
    });

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      const aspect = Math.max(1, width) / Math.max(1, height);
      const viewHeight = 300;
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    };

    const state = {
      dragging: false,
      dragActive: false,
      lastX: 0,
      lastY: 0,
      dragStartX: 0,
      dragStartY: 0,
      dragStartTime: 0,
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      frame: 0
    };

    const onPointerDown = event => {
      state.dragging = true;
      state.dragActive = false;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.dragStartX = event.clientX;
      state.dragStartY = event.clientY;
      state.dragStartTime = performance.now();
      mount.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = event => {
      if (!state.dragging) return;
      if (!state.dragActive) {
        const heldLongEnough = performance.now() - state.dragStartTime >= POINTER_DRAG_DELAY_MS;
        const movedFarEnough = Math.hypot(
          event.clientX - state.dragStartX,
          event.clientY - state.dragStartY
        ) >= POINTER_DRAG_DISTANCE;
        if (!heldLongEnough || !movedFarEnough) return;
        state.dragActive = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        return;
      }
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.targetYaw = THREE.MathUtils.clamp(state.targetYaw + dx * 0.004, -0.34, 0.34);
      state.targetPitch = THREE.MathUtils.clamp(state.targetPitch + dy * 0.002, -0.12, 0.12);
    };

    const onPointerUp = event => {
      state.dragging = false;
      state.dragActive = false;
      mount.releasePointerCapture?.(event.pointerId);
    };

    mount.addEventListener('pointerdown', onPointerDown);
    mount.addEventListener('pointermove', onPointerMove);
    mount.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('pointerleave', onPointerUp);
    window.addEventListener('resize', resize);

    const animate = () => {
      const now = performance.now();
      state.yaw += (state.targetYaw - state.yaw) * 0.08;
      state.pitch += (state.targetPitch - state.pitch) * 0.08;
      cardsGroup.position.y = Math.sin(now * 0.0014 + cardFloatPhase) * (expanded ? 1.4 : 2.2);
      cardsGroup.position.z = Math.cos(now * 0.0014 + cardFloatPhase) * (expanded ? 0.25 : 0.45);
      trayGlow.material.opacity = trayGlow.material.userData.baseOpacity + Math.sin(now * 0.0014 + cardFloatPhase) * 0.16;
      hoverGlow.material.opacity = hoverGlow.material.userData.baseOpacity + Math.sin(now * 0.0014 + cardFloatPhase + 0.7) * 0.08;
      packageRoot.rotation.y = state.yaw;
      packageRoot.rotation.x = state.pitch;
      packageRoot.rotation.z = 0;
      renderer.render(scene, camera);
      state.frame = requestAnimationFrame(animate);
    };

    resize();
    animate();

    return () => {
      cancelAnimationFrame(state.frame);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('pointerleave', onPointerUp);
      window.removeEventListener('resize', resize);
      disposeThreeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [items, expanded, settings]);

  return (
    <>
      <div className="package-reference">
        <span>3D component template</span>
        <small>drag to inspect holder depth</small>
      </div>
      <section className="package-viewport" ref={mountRef} aria-label="3D card holder preview" />
    </>
  );
}

function createPackageBoxPart(width, height, depth, color, opacity, edgeOpacity = 0.5) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity,
      roughness: 0.48,
      metalness: 0.08,
      depthWrite: true,
      depthTest: true,
      fog: false
    })
  );
  group.add(mesh);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color: 0x7bfbff,
      transparent: true,
      opacity: edgeOpacity,
      depthWrite: false
    })
  );
  if (edgeOpacity > 0.01) group.add(edges);
  return group;
}

function createPackageGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(40,244,255,.95)');
  gradient.addColorStop(0.3, 'rgba(40,244,255,.38)');
  gradient.addColorStop(0.66, 'rgba(40,244,255,.12)');
  gradient.addColorStop(1, 'rgba(40,244,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPackageFloorGlowObject({ namePrefix = 'package', width = 460, depth = 144, opacity = 0.28 } = {}) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: false,
      fog: false
    })
  );
  floor.name = `${namePrefix}-floor-glow`;
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -8;
  floor.material.userData.baseOpacity = opacity;
  floor.raycast = () => {};
  return floor;
}

function createPackageGlassPanel(name, width, height, color, opacity) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  panel.name = name;
  panel.material.userData.baseOpacity = opacity;
  panel.raycast = () => {};
  return panel;
}

function createPackageLineSegments(name, segments, color = 0x28f4ff, opacity = 0.74) {
  const points = [];
  segments.forEach(([start, end]) => {
    points.push(new THREE.Vector3(...start), new THREE.Vector3(...end));
  });
  const line = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  line.name = name;
  line.material.userData.baseOpacity = opacity;
  line.raycast = () => {};
  return line;
}

function createPackageReferenceDockObject({
  labelText = '822',
  expanded = true,
  guardHeight = 76,
  namePrefix = 'package-lab'
} = {}) {
  const dock = new THREE.Group();
  dock.name = `${namePrefix}-reference-dock`;

  const width = expanded ? 188 : 166;
  const depth = expanded ? 88 : 78;
  const wallHeight = THREE.MathUtils.clamp(guardHeight * (expanded ? 0.34 : 0.28), 20, 30);
  const frontZ = depth / 2;
  const rearZ = -depth / 2;
  const sideX = width / 2;
  const baseY = 4;
  const topY = baseY + wallHeight;

  const bottomGlass = createPackageGlassPanel(
    `${namePrefix}-dock-bottom-glass`,
    width,
    depth,
    0x0d9fb0,
    expanded ? 0.2 : 0.16
  );
  bottomGlass.rotation.x = -Math.PI / 2;
  bottomGlass.position.set(0, baseY, 0);
  dock.add(bottomGlass);

  const frontGlass = createPackageGlassPanel(
    `${namePrefix}-dock-front-glass`,
    width,
    wallHeight,
    0x19ddeb,
    expanded ? 0.2 : 0.17
  );
  frontGlass.position.set(0, baseY + wallHeight / 2, frontZ);
  dock.add(frontGlass);

  const rearGlass = createPackageGlassPanel(
    `${namePrefix}-dock-rear-glass`,
    width,
    wallHeight,
    0x168b9a,
    0.11
  );
  rearGlass.position.set(0, baseY + wallHeight / 2, rearZ);
  dock.add(rearGlass);

  const leftGlass = createPackageGlassPanel(
    `${namePrefix}-dock-left-glass`,
    depth,
    wallHeight,
    0x18c8d7,
    0.14
  );
  leftGlass.rotation.y = Math.PI / 2;
  leftGlass.position.set(-sideX, baseY + wallHeight / 2, 0);
  dock.add(leftGlass);

  const rightGlass = createPackageGlassPanel(
    `${namePrefix}-dock-right-glass`,
    depth,
    wallHeight,
    0x18c8d7,
    0.14
  );
  rightGlass.rotation.y = Math.PI / 2;
  rightGlass.position.set(sideX, baseY + wallHeight / 2, 0);
  dock.add(rightGlass);

  const rim = createPackageLineSegments(
    `${namePrefix}-dock-rim`,
    [
      [[-sideX, topY, frontZ], [sideX, topY, frontZ]],
      [[sideX, topY, frontZ], [sideX, topY, rearZ]],
      [[sideX, topY, rearZ], [-sideX, topY, rearZ]],
      [[-sideX, topY, rearZ], [-sideX, topY, frontZ]],
      [[-sideX, baseY, frontZ], [sideX, baseY, frontZ]],
      [[sideX, baseY, frontZ], [sideX, baseY, rearZ]],
      [[sideX, baseY, rearZ], [-sideX, baseY, rearZ]],
      [[-sideX, baseY, rearZ], [-sideX, baseY, frontZ]],
      [[-sideX, baseY, frontZ], [-sideX, topY, frontZ]],
      [[sideX, baseY, frontZ], [sideX, topY, frontZ]],
      [[sideX, baseY, rearZ], [sideX, topY, rearZ]],
      [[-sideX, baseY, rearZ], [-sideX, topY, rearZ]]
    ],
    0x55fbff,
    expanded ? 0.78 : 0.66
  );
  rim.renderOrder = 1130;
  dock.add(rim);

  const frontAccent = createPackageLineSegments(
    `${namePrefix}-dock-front-accent`,
    [
      [[-sideX * 0.82, topY - 5, frontZ + 0.6], [sideX * 0.82, topY - 5, frontZ + 0.6]],
      [[-sideX * 0.68, baseY + 7, frontZ + 0.6], [sideX * 0.68, baseY + 7, frontZ + 0.6]]
    ],
    0x28f4ff,
    0.9
  );
  frontAccent.renderOrder = 1140;
  dock.add(frontAccent);

  const padGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.72, depth * 0.56),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: expanded ? 0.88 : 0.72,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  padGlow.name = `${namePrefix}-dock-pad-glow`;
  padGlow.rotation.x = -Math.PI / 2;
  padGlow.position.set(0, 14, 12);
  padGlow.material.userData.baseOpacity = padGlow.material.opacity;
  padGlow.raycast = () => {};
  dock.add(padGlow);

  const coreGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.44, depth * 0.28),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: expanded ? 0.76 : 0.58,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  coreGlow.name = `${namePrefix}-dock-core-glow`;
  coreGlow.rotation.x = -Math.PI / 2;
  coreGlow.position.set(0, 18, 12);
  coreGlow.material.userData.baseOpacity = coreGlow.material.opacity;
  coreGlow.raycast = () => {};
  dock.add(coreGlow);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(82, 28),
    new THREE.MeshBasicMaterial({
      map: createPackageDockLabelTexture(labelText),
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
      fog: false
    })
  );
  label.name = `${namePrefix}-dock-year-label`;
  label.position.set(0, -16, frontZ + 4);
  label.material.userData.baseOpacity = label.material.opacity;
  label.raycast = () => {};
  dock.add(label);

  dock.traverse((child, index) => {
    if (!child.material) return;
    if (child.renderOrder === 0) child.renderOrder = child.name.includes('front-glass') ? 1120 : 720 + index;
    child.material.userData.baseOpacity ??= child.material.opacity;
  });

  dock.userData.trayGlow = padGlow;
  dock.userData.hoverGlow = coreGlow;
  return dock;
}

function createPackageTrayObject({
  labelText = 'GROUP',
  labelTexture = null,
  labelWidth = 48,
  labelHeight = 14,
  labelPosition = new THREE.Vector3(-47, PACKAGE_TRAY.frontLipHeight / 2 + 5, PACKAGE_TRAY.labelZ),
  labelOpacity = 1,
  labelDepthTest = true,
  trayGlowOpacity = 0.78,
  hoverGlowOpacity = 0.5,
  namePrefix = 'package'
} = {}) {
  const tray = new THREE.Group();
  tray.name = `${namePrefix}-tray`;

  const trayGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(190, 126),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: trayGlowOpacity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  trayGlow.name = `${namePrefix}-tray-glow`;
  trayGlow.rotation.x = -Math.PI / 2;
  trayGlow.position.set(0, 6.5, 8);
  trayGlow.material.userData.baseOpacity = trayGlowOpacity;
  trayGlow.raycast = () => {};
  tray.add(trayGlow);

  const hoverGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(118, 72),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: hoverGlowOpacity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  hoverGlow.name = `${namePrefix}-hover-glow`;
  hoverGlow.rotation.x = -Math.PI / 2;
  hoverGlow.position.set(0, 16, 16);
  hoverGlow.material.userData.baseOpacity = hoverGlowOpacity;
  hoverGlow.raycast = () => {};
  tray.add(hoverGlow);

  const shelf = createPackageBoxPart(PACKAGE_TRAY.width, PACKAGE_TRAY.shelfHeight, PACKAGE_TRAY.depth, 0x123a42, 0.52, 0);
  shelf.name = `${namePrefix}-bottom-shelf`;
  shelf.position.set(0, 0, PACKAGE_TRAY.shelfZ);
  tray.add(shelf);

  const rearLip = createPackageBoxPart(PACKAGE_TRAY.width, PACKAGE_TRAY.lipHeight, PACKAGE_TRAY.wallThickness, 0x183d4a, 0.26, 0);
  rearLip.name = `${namePrefix}-rear-lip`;
  rearLip.position.set(0, PACKAGE_TRAY.lipHeight / 2 + 5, PACKAGE_TRAY.rearZ);
  tray.add(rearLip);

  const frontLip = createPackageBoxPart(PACKAGE_TRAY.width - 10, PACKAGE_TRAY.frontLipHeight, PACKAGE_TRAY.wallThickness, 0x123a42, 0.5, 0);
  frontLip.name = `${namePrefix}-front-lip`;
  frontLip.position.set(0, PACKAGE_TRAY.frontLipHeight / 2 + 5, PACKAGE_TRAY.frontZ);
  tray.add(frontLip);

  const leftWall = createPackageBoxPart(PACKAGE_TRAY.wallThickness, PACKAGE_TRAY.lipHeight, PACKAGE_TRAY.depth, 0x154a50, 0.32, 0);
  leftWall.name = `${namePrefix}-side-lip-left`;
  leftWall.position.set(-PACKAGE_TRAY.width / 2 + PACKAGE_TRAY.wallThickness / 2, PACKAGE_TRAY.lipHeight / 2 + 5, PACKAGE_TRAY.shelfZ);
  tray.add(leftWall);

  const rightWall = createPackageBoxPart(PACKAGE_TRAY.wallThickness, PACKAGE_TRAY.lipHeight, PACKAGE_TRAY.depth, 0x154a50, 0.32, 0);
  rightWall.name = `${namePrefix}-side-lip-right`;
  rightWall.position.set(PACKAGE_TRAY.width / 2 - PACKAGE_TRAY.wallThickness / 2, PACKAGE_TRAY.lipHeight / 2 + 5, PACKAGE_TRAY.shelfZ);
  tray.add(rightWall);

  const labelPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(labelWidth, labelHeight),
    new THREE.MeshBasicMaterial({
      map: labelTexture || createPackageLabelTexture(labelText),
      transparent: true,
      opacity: labelOpacity,
      depthWrite: false,
      depthTest: labelDepthTest,
      side: THREE.DoubleSide,
      fog: false
    })
  );
  labelPlane.name = `${namePrefix}-tray-label`;
  labelPlane.position.copy(labelPosition);
  labelPlane.material.userData.baseOpacity = labelOpacity;
  tray.add(labelPlane);

  tray.userData.trayGlow = trayGlow;
  tray.userData.hoverGlow = hoverGlow;
  tray.userData.label = labelPlane;
  return tray;
}

function createPackageCard(item) {
  const group = new THREE.Group();
  const type = typeMap[item.type];
  const cardBack = new THREE.Mesh(
    new THREE.BoxGeometry(82, 116, 3.6),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(type.color),
      emissive: new THREE.Color(type.color),
      emissiveIntensity: 0.08,
      transparent: true,
      opacity: 0.88,
      roughness: 0.55,
      metalness: 0.08,
      depthWrite: false
    })
  );
  group.add(cardBack);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(76, 108),
    new THREE.MeshBasicMaterial({
      map: makeObjectTexture(item, false),
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  front.position.z = 1.9;
  group.add(front);
  requestAssetImage(getItemAsset(item), () => {
    if (!front.material) return;
    const oldMap = front.material.map;
    front.material.map = makeObjectTexture(item, false);
    front.material.needsUpdate = true;
    oldMap?.dispose?.();
  });

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cardBack.geometry),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(type.color),
      transparent: true,
      opacity: 0.96,
      depthWrite: false
    })
  );
  group.add(edges);
  return group;
}

function createPackageLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = '700 58px "Microsoft YaHei", Arial, sans-serif';
  ctx.fillText(text, 22, 94);
  ctx.strokeStyle = 'rgba(123,251,255,.72)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(18, 118);
  ctx.lineTo(486, 118);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPackageDockLabelTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(40,244,255,.55)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = 'rgba(248,253,255,.96)';
  ctx.font = '800 48px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function PackageSlider({ label, value, min, max, step, onChange }) {
  return (
    <label className="package-slider">
      <span>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={event => onChange(event.target.value)}
      />
      <output>{value}</output>
    </label>
  );
}

function FullscreenEntryControl({ fullscreenSupported, onEnterFullscreen }) {
  return (
    <button
      className="fullscreen-control fullscreen-control--enter"
      type="button"
      onClick={event => {
        event.stopPropagation();
        void onEnterFullscreen();
      }}
      disabled={!fullscreenSupported}
      aria-label="全屏"
      title="全屏"
    >
      <Maximize2 size={20} />
    </button>
  );
}

function FullscreenHud({ query, onQueryChange, touring, onToggleTouring }) {
  return (
    <header
      className="fullscreen-hud"
      aria-label="全屏控制"
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      <div className="fullscreen-hud__actions">
        <label className="search search--compact">
          <Search size={16} />
          <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="搜索景点、故事、地点" />
        </label>
        <button
          className={`start ${touring ? 'is-active' : ''}`}
          type="button"
          onClick={onToggleTouring}
          aria-label={touring ? '暂停' : '开始'}
          title={touring ? '暂停' : '开始'}
        >
          {touring ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>
    </header>
  );
}

function FullscreenControls({ isImmersive, onToggleImmersive, onExitFullscreen }) {
  const label = isImmersive ? '退出沉浸' : '沉浸';
  return (
    <>
      <button
        className={`fullscreen-control fullscreen-control--immersive ${isImmersive ? 'is-active' : ''}`}
        type="button"
        onClick={event => {
          event.stopPropagation();
          onToggleImmersive();
        }}
        aria-label={label}
        title={label}
      >
        <EyeOff size={20} />
      </button>
      <button
        className="fullscreen-control fullscreen-control--exit"
        type="button"
        onClick={event => {
          event.stopPropagation();
          void onExitFullscreen();
        }}
        aria-label="退出全屏"
        title="退出全屏"
      >
        <Minimize2 size={20} />
      </button>
    </>
  );
}

function LayoutDock({ activeLayout, onLayoutChange, compact = false }) {
  const layouts = [
    { id: 'overview', label: '总览', icon: CircleDot },
    { id: 'timeline', label: '年表', icon: GalleryVerticalEnd },
    { id: 'map', label: '地图', icon: MapIcon }
  ];

  return (
    <section
      className={`layout-dock ${compact ? 'is-compact' : ''}`}
      aria-label="布局切换"
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      {layouts.map(({ id, label, icon: Icon }) => (
        <button
          className={activeLayout === id ? 'is-active' : ''}
          type="button"
          key={id}
          onClick={() => onLayoutChange(id)}
          aria-pressed={activeLayout === id}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </section>
  );
}

function FocusCard({ item, onPrevious, onNext, onClose }) {
  const type = typeMap[item.type];
  const asset = getItemAsset(item);
  const placeName = getReadableLocationName(item.location);
  const topicName = item.title === placeName ? item.material : item.title;
  return (
    <section
      className="focus-card"
      aria-label="中心景点"
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      <button className="focus-card__close" type="button" onClick={onClose} aria-label="关闭中心景点">
        <X size={18} />
      </button>
      <figure className="focus-card__image panel-preview" data-type={item.type}>
        {asset ? (
          <img className="focus-card__photo" src={asset.src} alt={asset.title} />
        ) : null}
        <span className="focus-card__shade" />
        <span className="focus-card__index">{getFocusCardImageLabel(item, asset)}</span>
      </figure>
      <div className="focus-card__body">
        <div className="panel-kicker" style={{ color: type.color }}>
          <Sparkles size={16} />
          {type.label}
        </div>
        <h2>{placeName}</h2>
        <p className="panel-meta">{topicName} · {item.material} · {item.year}</p>
        <p className="panel-copy">{item.description}</p>
        <div className="tag-row">
          {item.tags.map(tag => (
            <span key={tag}><Tag size={12} />{tag}</span>
          ))}
        </div>
      </div>
      <div className="focus-card__actions">
        <button type="button" onClick={onPrevious}>上一站</button>
        <button className="focus-card__primary" type="button">
          进入
          <ArrowUpRight size={17} />
        </button>
        <button type="button" onClick={onNext}>下一站</button>
      </div>
    </section>
  );
}

function GuidePet({ context, items: layoutItems }) {
  const [mode, setMode] = useState('sleeping');
  const [position, setPosition] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const shellRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const dragRef = useRef(null);
  const isSendingRef = useRef(false);
  const contextRef = useRef(context);

  const contextKey = context ? `${context.kind}:${context.id}` : 'none';
  const nearLeft = position ? position.x < window.innerWidth * 0.46 : false;
  const nearTop = position ? position.y < 300 : false;
  const bubbleText = context
    ? `我看到你在看「${context.name}」，要我讲讲吗？`
    : '先点一个展品，我可以帮你讲解';

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    if (mode === 'chat') {
      setMessages(getGuideOpeningMessages(context));
    }
  }, [contextKey, context, mode]);

  useEffect(() => {
    if (mode !== 'chat') return undefined;
    const frameId = window.requestAnimationFrame(() => {
      const node = messagesRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [messages, isAnswering, mode]);

  useEffect(() => {
    const handleResize = () => {
      setPosition(current => {
        if (!current) return current;
        const rect = shellRef.current?.getBoundingClientRect();
        const width = rect?.width || 78;
        const height = rect?.height || 78;
        const margin = 10;
        return {
          x: Math.min(Math.max(margin, current.x), window.innerWidth - width - margin),
          y: Math.min(Math.max(margin, current.y), window.innerHeight - height - margin)
        };
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const clampPosition = (x, y) => {
    const shell = shellRef.current;
    const rect = shell?.getBoundingClientRect();
    const width = rect?.width || 78;
    const height = rect?.height || 78;
    const margin = 10;
    return {
      x: Math.min(Math.max(margin, x), window.innerWidth - width - margin),
      y: Math.min(Math.max(margin, y), window.innerHeight - height - margin)
    };
  };

  const openChat = () => {
    const currentContext = contextRef.current;
    setMode('chat');
    setMessages(getGuideOpeningMessages(currentContext));
    window.setTimeout(() => inputRef.current?.focus(), 60);
  };

  const activatePet = () => {
    if (mode === 'sleeping') {
      setMode('bubble');
      return;
    }
    if (mode === 'bubble') openChat();
  };

  const closeChat = () => {
    setMode('sleeping');
    setMessages([]);
    setQuestion('');
    isSendingRef.current = false;
    setIsAnswering(false);
  };

  const handlePetPointerDown = event => {
    if (event.button && event.pointerType === 'mouse') return;
    event.preventDefault();
    event.stopPropagation();
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(current => current || { x: rect.left, y: rect.top });
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      moved: false
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePetPointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    setPosition(clampPosition(drag.originX + dx, drag.originY + dy));
  };

  const handlePetPointerUp = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!drag.moved) activatePet();
  };

  const handlePetKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activatePet();
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAnswering || isSendingRef.current) return;
    const currentContext = contextRef.current;
    const nextMessages = [...messages, { role: 'user', text: trimmed }];
    isSendingRef.current = true;
    setMessages(nextMessages);
    setQuestion('');
    setIsAnswering(true);
    try {
      const answer = await requestGuideAnswer(currentContext, trimmed, layoutItems, nextMessages);
      setMessages(current => [...current, { role: 'pet', text: answer }]);
    } finally {
      isSendingRef.current = false;
      setIsAnswering(false);
    }
  };

  return (
    <section
      className={`guide-pet guide-pet--${mode} ${context ? 'has-context' : 'is-waiting'} ${nearLeft ? 'is-near-left' : ''} ${nearTop ? 'is-near-top' : ''}`}
      ref={shellRef}
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
      aria-live="polite"
      onPointerDown={event => event.stopPropagation()}
      onPointerUp={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()}
    >
      {mode === 'bubble' ? (
        <button className="guide-pet__bubble" type="button" onClick={openChat}>
          {bubbleText}
        </button>
      ) : null}

      {mode === 'chat' ? (
        <aside className="guide-chat" aria-label="AI 导览聊天">
          <header className="guide-chat__header">
            <div>
              <span>{GUIDE_PET_NAME}导览</span>
              <strong>{context?.name || '等待选择展品'}</strong>
            </div>
            <button className="guide-chat__close" type="button" onClick={closeChat} aria-label="关闭导览">
              <X size={17} />
            </button>
          </header>
          <div className="guide-chat__messages" ref={messagesRef} aria-busy={isAnswering}>
            {messages.map((message, index) => (
              <p className={`guide-chat__message guide-chat__message--${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </p>
            ))}
            {isAnswering ? (
              <p className="guide-chat__message guide-chat__message--pet guide-chat__message--thinking">讲解中</p>
            ) : null}
          </div>
          <form className="guide-chat__form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={question}
              onChange={event => setQuestion(event.target.value)}
              disabled={isAnswering}
              placeholder="问我这张图讲了什么、什么时候发生、下一站去哪"
              aria-label="向导览提问"
            />
            <button type="submit" aria-label="发送问题" disabled={!question.trim() || isAnswering}>
              <ArrowUpRight size={18} />
            </button>
          </form>
        </aside>
      ) : null}

      <button
        className="guide-pet__avatar"
        type="button"
        aria-label={`${GUIDE_PET_NAME}导览桌宠`}
        onPointerDown={handlePetPointerDown}
        onPointerMove={handlePetPointerMove}
        onPointerUp={handlePetPointerUp}
        onPointerCancel={handlePetPointerUp}
        onKeyDown={handlePetKeyDown}
      >
        <span className="guide-pet__aura" />
        <span className="guide-pet__antenna" />
        <span className="guide-pet__head">
          <span className="guide-pet__eye guide-pet__eye--left" />
          <span className="guide-pet__eye guide-pet__eye--right" />
          <span className="guide-pet__mouth" />
        </span>
        <span className="guide-pet__body">
          <span className="guide-pet__badge" />
        </span>
        <span className="guide-pet__shadow" />
      </button>
    </section>
  );
}

function SpaceScene({
  items,
  selectedId,
  immersive,
  onSelect,
  touring,
  activeLayout,
  timelineGroupId,
  onTimelineGroupSelect,
  onTimelineGroupClear,
  mapLocationId,
  onMapLocationSelect,
  onMapLocationClear
}) {
  const mountRef = useRef(null);
  const latest = useRef({
    items,
    selectedId,
    immersive,
    onSelect,
    touring,
    activeLayout,
    timelineGroupId,
    onTimelineGroupSelect,
    onTimelineGroupClear,
    mapLocationId,
    onMapLocationSelect,
    onMapLocationClear
  });

  useEffect(() => {
    latest.current = {
      items,
      selectedId,
      immersive,
      onSelect,
      touring,
      activeLayout,
      timelineGroupId,
      onTimelineGroupSelect,
      onTimelineGroupClear,
      mapLocationId,
      onMapLocationSelect,
      onMapLocationClear
    };
  }, [
    items,
    selectedId,
    immersive,
    onSelect,
    touring,
    activeLayout,
    timelineGroupId,
    onTimelineGroupSelect,
    onTimelineGroupClear,
    mapLocationId,
    onMapLocationSelect,
    onMapLocationClear
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02050a, 0.00105);

    const camera = new THREE.PerspectiveCamera(54, mount.clientWidth / mount.clientHeight, 1, 6200);
    camera.position.set(0, 46, 760);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.25));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight(0x9bdcff, 0.82);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xd8ffff, 1.35);
    keyLight.position.set(-140, 260, 360);
    scene.add(keyLight);
    const trayLight = new THREE.PointLight(0x28f4ff, 2.4, 980);
    trayLight.position.set(0, 90, 260);
    scene.add(trayLight);

    const cards = new Map();
    const timelineHolders = new Map();
    const particleField = createParticleField();
    scene.add(particleField);

    const sphereGuide = createSphereGuide();
    const timelineGuide = createTimelineGuide();
    const mapGuide = createMapGuide();
    const mapSelectionPulse = createMapSelectionPulse();
    mapGuide.add(mapSelectionPulse);
    const mapClusterConnector = createMapClusterConnector();
    root.add(mapClusterConnector);
    const mapPickables = [];
    mapGuide.traverse(child => {
      if (child.userData?.mapLocationId) mapPickables.push(child);
    });
    root.add(sphereGuide);
    root.add(timelineGuide);
    root.add(mapGuide);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const state = {
      yaw: -0.24,
      pitch: 0.07,
      distance: 760,
      timelineFlow: 0,
      timelineTargetFlow: 0,
      timelineMoveSpeed: 0,
      timelineOrbit: 0,
      timelineHeight: 0,
      expandedTimelineGroup: null,
      keys: new Set(),
      mapPan: new THREE.Vector2(0, 0),
      mapPanTarget: new THREE.Vector2(0, 0),
      mapZoom: XIANGDONG_MAP_DEFAULT_ZOOM,
      mapZoomTarget: XIANGDONG_MAP_DEFAULT_ZOOM,
      dragging: false,
      dragActive: false,
      lastX: 0,
      lastY: 0,
      dragStartX: 0,
      dragStartY: 0,
      dragStartTime: 0,
      dragMoved: false,
      clock: new THREE.Clock(),
      motionTime: 0,
      focusBlend: 0,
      layoutKey: 'overview-base',
      lastLayout: 'overview',
      layoutTransition: null,
      layoutTransitionDone: false,
      relayoutPulse: 0,
      cameraLookAt: new THREE.Vector3(0, 10, 0),
      frame: 0
    };

    function ensureCards() {
      const visible = new Set(latest.current.items.map(item => item.id));
      [...cards.entries()].forEach(([id, mesh]) => {
        if (!visible.has(id)) {
          root.remove(mesh);
          disposeThreeObject(mesh);
          cards.delete(id);
        }
      });

      latest.current.items.forEach(item => {
        if (cards.has(item.id)) return;
        const mesh = createCardObject(item, item.id === latest.current.selectedId);
        const initialLayout = state.layoutTransition ? state.layoutTransition.from : latest.current.activeLayout;
        mesh.position.copy(getLayoutTarget(
          item,
          latest.current.items,
          initialLayout,
          state.motionTime,
          state.focusBlend,
          state.layoutKey,
          state.relayoutPulse,
          initialLayout === 'timeline' ? latest.current.timelineGroupId : null,
          state.timelineFlow
        ));
        mesh.rotation.y = seeded(item.id, 4) * 0.8 - 0.4;
        mesh.rotation.x = seeded(item.id, 9) * 0.28 - 0.14;
        root.add(mesh);
        cards.set(item.id, mesh);
      });
    }

    function updateTimelineHolders(active, layoutItems, introMix = 1) {
      if (active !== 'timeline') {
        timelineHolders.forEach(holder => {
          holder.visible = false;
        });
        return;
      }

      const groups = getTimelineGroups(layoutItems);
      const visibleGroups = new Set(groups.map(group => group.id));
      [...timelineHolders.entries()].forEach(([id, holder]) => {
        if (!visibleGroups.has(id)) {
          root.remove(holder);
          disposeThreeObject(holder);
          timelineHolders.delete(id);
        }
      });

      groups.forEach(group => {
        let holder = timelineHolders.get(group.id);
        const expanded = latest.current.timelineGroupId === group.id;
        if (!holder) {
          holder = createTimelineHolderObject(group, expanded);
          holder.position.copy(getTimelineVisualModel(group, latest.current.timelineGroupId).target);
          root.add(holder);
          timelineHolders.set(group.id, holder);
        }

        const textureKey = `${group.id}-${expanded}`;
        if (holder.userData.textureKey !== textureKey) {
          updateTimelineHolderObject(holder, group, expanded);
          holder.userData.textureKey = textureKey;
        }

        const visual = getTimelineVisualModel(group, latest.current.timelineGroupId);
        const progressAhead = group.progress - state.timelineFlow;
        holder.visible = true;
        holder.position.lerp(visual.target, 0.045);
        orientTimelineHolder(holder, visual);
        const depthFocus = getTimelineDepthFocus(progressAhead, expanded);
        const holderScale = visual.scale.clone().multiplyScalar(depthFocus * (0.82 + introMix * 0.18));
        holder.scale.lerp(holderScale, 0.09);
        const holderOpacity = visual.opacity * (0.42 + depthFocus * 0.58) * introMix;
        holder.userData.timelineOpacity = holderOpacity;
        setTimelineHolderOpacity(holder, holderOpacity);
        updateTimelineHolderGlowPulse(holder, group, expanded, holderOpacity, performance.now() * 0.001);
        setTimelineHolderRenderOrder(holder, getTimelineRenderOrder(Math.abs(progressAhead)));
      });
    }

    function animate() {
      const delta = Math.min(0.05, state.clock.getDelta());
      const selected = latest.current.selectedId;
      const active = latest.current.activeLayout;
      const hasFocus = Boolean(selected);
      const maxTimelineFlow = getTimelineMaxFlowForItems(latest.current.items);

      if (state.lastLayout !== active) {
        const previousLayout = state.lastLayout;
        state.layoutTransition = {
          from: previousLayout,
          to: active,
          elapsed: 0,
          duration: LAYOUT_TRANSITION_DURATION,
          cardStarts: new Map([...cards.entries()].map(([id, mesh]) => [id, mesh.position.clone()])),
          cameraStart: camera.position.clone(),
          lookAtStart: state.cameraLookAt.clone()
        };
        state.layoutTransitionDone = false;
        state.lastLayout = active;
        state.relayoutPulse = 1;
        if (active === 'timeline') {
          state.timelineTargetFlow = THREE.MathUtils.clamp(state.timelineTargetFlow, 0, maxTimelineFlow);
          state.timelineFlow = THREE.MathUtils.clamp(state.timelineFlow, 0, maxTimelineFlow);
        }
      }

      if (state.layoutTransition) {
        state.layoutTransition.elapsed = Math.min(
          state.layoutTransition.duration,
          state.layoutTransition.elapsed + delta
        );
        if (state.layoutTransition.elapsed >= state.layoutTransition.duration) {
          state.layoutTransitionDone = true;
        }
      }

      ensureCards();

      if (active === 'timeline' && latest.current.timelineGroupId !== state.expandedTimelineGroup) {
        state.expandedTimelineGroup = latest.current.timelineGroupId;
        state.relayoutPulse = 1;
        if (state.expandedTimelineGroup) {
          state.timelineTargetFlow = THREE.MathUtils.clamp(
            getTimelineGroupProgressById(state.expandedTimelineGroup, latest.current.items) - 120,
            0,
            maxTimelineFlow
          );
        }
      }

      if (latest.current.touring && !state.dragging) {
        state.motionTime += delta;
      }

      if (active === 'timeline') {
        const forward =
          (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0) -
          (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0);
        const turn =
          (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) -
          (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0);
        const targetMoveSpeed = forward * TIMELINE_MOVE_MAX_SPEED;
        const moveResponse = forward ? TIMELINE_MOVE_ACCEL_RESPONSE : TIMELINE_MOVE_DECEL_RESPONSE;
        state.timelineMoveSpeed += (targetMoveSpeed - state.timelineMoveSpeed) * (1 - Math.exp(-delta * moveResponse));
        if (Math.abs(state.timelineMoveSpeed) < 1) state.timelineMoveSpeed = 0;
        if (state.timelineMoveSpeed) {
          state.timelineTargetFlow = THREE.MathUtils.clamp(
            state.timelineTargetFlow + state.timelineMoveSpeed * delta,
            0,
            maxTimelineFlow
          );
        }
        if (turn) {
          state.timelineOrbit = THREE.MathUtils.clamp(
            state.timelineOrbit + turn * delta * 0.58,
            -TIMELINE_ORBIT_LIMIT,
            TIMELINE_ORBIT_LIMIT
          );
        }
        state.timelineFlow += (state.timelineTargetFlow - state.timelineFlow) * (1 - Math.exp(-delta * 8.5));
      } else {
        state.timelineMoveSpeed = 0;
      }

      const focusTarget = hasFocus ? 1 : 0;
      state.focusBlend += (focusTarget - state.focusBlend) * (1 - Math.exp(-delta * 4.8));

      const nextLayoutKey = `${active}-${selected || 'base'}`;
      if (state.layoutKey !== nextLayoutKey) {
        state.layoutKey = nextLayoutKey;
        state.relayoutPulse = 1;
      }
      state.relayoutPulse = Math.max(0, state.relayoutPulse - delta * 1.45);

      const layoutItems = selected
        ? latest.current.items.filter(item => item.id !== selected)
        : latest.current.items;
      const selectedMapLocationId = active === 'map' ? latest.current.mapLocationId : null;
      const mapClusterItems = selectedMapLocationId
        ? getMapLocationItems(latest.current.items, selectedMapLocationId)
        : [];
      const mapClusterIds = new Set(mapClusterItems.map(item => item.id));
      const mapRepresentatives = active === 'map' ? getMapRepresentativeIds(layoutItems) : null;
      const positionItems = mapRepresentatives
        ? layoutItems.filter(item => mapRepresentatives.has(item.id))
        : layoutItems;
      const layoutTransition = state.layoutTransition;
      const layoutTransitionMix = getLayoutTransitionMix(layoutTransition);
      const mapUiTime = performance.now() * 0.001;
      const timelineIntroMix = active === 'timeline'
        ? (layoutTransition?.to === 'timeline' ? layoutTransitionMix : 1)
        : 0;
      const targets = new Map();

      state.mapZoom += (state.mapZoomTarget - state.mapZoom) * (1 - Math.exp(-delta * 8));
      state.mapPan.lerp(state.mapPanTarget, 1 - Math.exp(-delta * 8));
      mapGuide.position.set(state.mapPan.x, XIANGDONG_MAP_BASE_Y + state.mapPan.y, 0);
      mapGuide.scale.set(state.mapZoom, state.mapZoom, 1);
      updateMapClusterConnector(
        mapClusterConnector,
        selectedMapLocationId,
        mapClusterItems,
        state.mapPan,
        state.mapZoom,
        mapUiTime
      );

      positionItems.forEach(item => {
        const target = getLayoutTarget(
          item,
          positionItems,
          active,
          state.motionTime,
          state.focusBlend,
          state.layoutKey,
          state.relayoutPulse,
          latest.current.timelineGroupId,
          state.timelineFlow
        );
        targets.set(item.id, active === 'map' ? transformMapPosition(target, state.mapPan, state.mapZoom) : target);
      });

      const targetFov = active === 'timeline' ? 66 : active === 'map' ? 58 : 47;
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-delta * 3.2));
      camera.updateProjectionMatrix();

      if (active === 'timeline') {
        const timelineCamera = getTimelineCameraState(state.timelineFlow, state.timelineOrbit, state.timelineHeight);
        if (layoutTransition) {
          camera.position.copy(layoutTransition.cameraStart).lerp(timelineCamera.position, layoutTransitionMix);
          state.cameraLookAt.copy(layoutTransition.lookAtStart).lerp(timelineCamera.lookAt, layoutTransitionMix);
        } else {
          const cameraEase = 1 - Math.exp(-delta * 2.8);
          camera.position.lerp(timelineCamera.position, cameraEase);
          state.cameraLookAt.lerp(timelineCamera.lookAt, cameraEase);
        }
        camera.lookAt(state.cameraLookAt);
      } else if (active === 'map') {
        const targetPosition = new THREE.Vector3(0, 22, 780);
        const targetLookAt = new THREE.Vector3(0, 12, -142);
        if (layoutTransition) {
          camera.position.copy(layoutTransition.cameraStart).lerp(targetPosition, layoutTransitionMix);
          state.cameraLookAt.copy(layoutTransition.lookAtStart).lerp(targetLookAt, layoutTransitionMix);
        } else {
          const mapCameraEase = 1 - Math.exp(-delta * 2.8);
          camera.position.lerp(targetPosition, mapCameraEase);
          state.cameraLookAt.lerp(targetLookAt, mapCameraEase);
        }
        camera.lookAt(state.cameraLookAt);
      } else {
        if (latest.current.touring && !state.dragging) state.yaw -= delta * 0.075;
        const y = 42 + Math.sin(state.pitch) * 175;
        const overviewPosition = new THREE.Vector3(
          Math.sin(state.yaw) * state.distance,
          y,
          Math.cos(state.yaw) * state.distance
        );
        const overviewLookAt = new THREE.Vector3(0, 10, 0);
        if (layoutTransition) {
          camera.position.copy(layoutTransition.cameraStart).lerp(overviewPosition, layoutTransitionMix);
          state.cameraLookAt.copy(layoutTransition.lookAtStart).lerp(overviewLookAt, layoutTransitionMix);
        } else {
          camera.position.copy(overviewPosition);
          state.cameraLookAt.copy(overviewLookAt);
        }
        camera.lookAt(state.cameraLookAt);
      }

      updateTimelineAirStars(timelineGuide, state.timelineFlow, camera, state.cameraLookAt);
      const timelineGuideOpacity = getLayoutGuideOpacity('timeline', active, layoutTransition, layoutTransitionMix);
      setParticleFieldOpacity(particleField, 1 - timelineGuideOpacity);
      setGuideOpacity(sphereGuide, getLayoutGuideOpacity('overview', active, layoutTransition, layoutTransitionMix));
      setGuideOpacity(timelineGuide, timelineGuideOpacity);
      setGuideOpacity(mapGuide, getLayoutGuideOpacity('map', active, layoutTransition, layoutTransitionMix));
      updateMapSelectionPulse(mapSelectionPulse, selectedMapLocationId, mapUiTime);
      updateMapFeatureSelection(mapGuide, selectedMapLocationId, mapUiTime);
      updateTimelineHolders(active, positionItems, timelineIntroMix);

      cards.forEach(mesh => {
        const item = mesh.userData.item;
        const isSelected = item.id === selected;
        const isMapClusterCard = active === 'map' && mapClusterIds.has(item.id);
        const visibleForMap = active !== 'map' || isMapClusterCard;
        mesh.visible = !isSelected && visibleForMap;
        if (!mesh.visible) return;

        if (mesh.userData.textureSelected !== isSelected) {
          updateCardObjectTexture(mesh, item, isSelected);
        }

        let target = active === 'map' && isMapClusterCard
          ? getMapCardClusterTarget(item, mapClusterItems, state.mapPan, state.mapZoom, state.motionTime, state.relayoutPulse)
          : targets.get(item.id) || mesh.position;
        const layoutEase = active === 'overview' ? 0.042 : active === 'timeline' ? 0.045 : 0.055;
        const timelineProgress = active === 'timeline' ? getTimelineItemProgress(item, positionItems) : 0;
        const progressAhead = timelineProgress - state.timelineFlow;
        const timelineGroup = active === 'timeline' ? getTimelineGroupMeta(item, positionItems) : null;
        const groupExpanded = active === 'timeline' && latest.current.timelineGroupId === timelineGroup?.id;
        const otherGroupDimmed = active === 'timeline' && latest.current.timelineGroupId && !groupExpanded;
        const timelineVisual = active === 'timeline' && timelineGroup
          ? getTimelineVisualModel(timelineGroup, latest.current.timelineGroupId)
          : null;
        const timelineDepthFocus = active === 'timeline' && timelineGroup
          ? getTimelineDepthFocus(progressAhead, groupExpanded)
          : 1;
        const timelineHolder = active === 'timeline' && timelineGroup
          ? timelineHolders.get(timelineGroup.id)
          : null;
        if (active === 'timeline' && timelineGroup) {
          target = getTimelineTarget(
            item,
            positionItems,
            state.motionTime,
            state.focusBlend,
            state.relayoutPulse,
            latest.current.timelineGroupId,
            state.timelineFlow,
            timelineHolder
          );
        }
        if (layoutTransition) {
          const finalTarget = target.clone();
          let startTarget = layoutTransition.cardStarts.get(item.id);
          if (!startTarget) {
            const rawStartTarget = getLayoutTarget(
              item,
              positionItems,
              layoutTransition.from,
              state.motionTime,
              state.focusBlend,
              state.layoutKey,
              state.relayoutPulse,
              layoutTransition.from === 'timeline' ? latest.current.timelineGroupId : null,
              state.timelineFlow
            );
            startTarget = layoutTransition.from === 'map'
              ? transformMapPosition(rawStartTarget, state.mapPan, state.mapZoom)
              : rawStartTarget;
          }
          target = startTarget.clone().lerp(finalTarget, layoutTransitionMix);
        }
        if (layoutTransition || (active === 'timeline' && timelineGroup)) {
          mesh.position.copy(target);
        } else {
          mesh.position.lerp(target, layoutEase);
        }
        if (active === 'timeline' && timelineGroup) {
          orientTimelineCard(mesh, timelineVisual, timelineGroup, item, groupExpanded, timelineHolder, !layoutTransition);
        } else if (active === 'map' && isMapClusterCard) {
          mesh.lookAt(camera.position);
          const cardIndex = getMapClusterItemIndex(item, mapClusterItems);
          const centerIndex = (mapClusterItems.length - 1) / 2;
          mesh.rotateZ((cardIndex - centerIndex) * 0.045);
        } else {
          mesh.lookAt(camera.position);
        }
        setCardObjectDepthTest(mesh, !(active === 'map' && isMapClusterCard));

        const distance = mesh.position.distanceTo(camera.position);
        let depthScale = 1;
        if (!selected && active === 'overview') {
          depthScale = THREE.MathUtils.clamp(distance / state.distance, 0.62, 1.3);
        } else if (active === 'timeline') {
          depthScale = 1;
        } else if (active === 'map') {
          depthScale = 1.04;
        }

        const timelineFocus = active === 'timeline'
          ? THREE.MathUtils.clamp(1 - Math.abs(progressAhead - 330) / 1200, 0, 1)
          : 0;
        const baseScale = active === 'timeline'
          ? (getTimelineHolderScaleFactor(timelineHolder, timelineVisual, timelineDepthFocus) * (
            groupExpanded
              ? 0.66 + seeded(item.id, 2) * 0.035
              : otherGroupDimmed
                ? 0.44 + seeded(item.id, 2) * 0.025
                : 0.5 + timelineFocus * 0.09 + seeded(item.id, 2) * 0.025
          ))
          : active === 'map'
            ? (isMapClusterCard ? 0.7 + seeded(item.id, 2) * 0.05 : 0.9 + seeded(item.id, 2) * 0.08)
            : 0.72 + seeded(item.id, 2) * 0.16;
        const focusScale = active === 'overview' ? 0.78 + seeded(item.id, 3) * 0.16 : baseScale;
        const scale = THREE.MathUtils.lerp(baseScale * depthScale, focusScale, state.focusBlend);
        if (active === 'timeline' && !layoutTransition) {
          mesh.scale.setScalar(scale);
        } else {
          mesh.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.09);
        }

        const focusOpacity = active === 'overview' ? 0.72 + seeded(item.id, 5) * 0.18 : 0.95;
        const distanceOpacity = active === 'timeline'
          ? (otherGroupDimmed ? 0.34 : 0.42 + timelineDepthFocus * 0.58)
          : 1;
        const mapClusterOpacity = active === 'map' && isMapClusterCard ? 0.97 : null;
        setCardObjectOpacity(mesh, mapClusterOpacity ?? THREE.MathUtils.lerp(distanceOpacity, focusOpacity, state.focusBlend));
        mesh.renderOrder = active === 'map' && isMapClusterCard
          ? 32000 + getMapClusterItemIndex(item, mapClusterItems)
          : active === 'timeline' && timelineGroup
          ? getTimelineRenderOrder(Math.abs(progressAhead)) + 160 + timelineGroup.itemIndex
          : Math.round(10000 - distance);
      });

      if (latest.current.touring && !state.dragging) particleField.rotation.y += 0.00035;
      renderer.render(scene, camera);
      if (state.layoutTransitionDone) {
        state.layoutTransition = null;
        state.layoutTransitionDone = false;
      }
      state.frame = requestAnimationFrame(animate);
    }

    function resize() {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    function setPointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function pickFrom(event, pickables) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(pickables, true)[0]?.object;
    }

    function pickMapLocation(event) {
      return pickFrom(event, mapPickables);
    }

    function pick(event) {
      const pickables = latest.current.activeLayout === 'map'
        ? [
            ...[...cards.values()].filter(mesh => mesh.visible),
            ...mapPickables
          ]
        : [
            ...cards.values(),
            ...timelineHolders.values()
          ].filter(mesh => mesh.visible);
      return pickFrom(event, pickables);
    }

    function isUiPointer(event) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      return Boolean(element?.closest(
        'button, input, label, .topline, .fullscreen-hud, .layout-dock, .focus-card, .fullscreen-control'
      ));
    }

    function onPointerDown(event) {
      if (isUiPointer(event)) return;
      state.dragging = true;
      state.dragActive = false;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.dragStartX = event.clientX;
      state.dragStartY = event.clientY;
      state.dragStartTime = performance.now();
      state.dragMoved = false;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      const active = latest.current.activeLayout;
      if (!state.dragging) {
        const hit = pick(event);
        renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
        return;
      }

      const totalX = event.clientX - state.dragStartX;
      const totalY = event.clientY - state.dragStartY;
      const movedDistance = Math.hypot(totalX, totalY);
      if (movedDistance >= POINTER_DRAG_DISTANCE) state.dragMoved = true;
      if (!state.dragActive) {
        renderer.domElement.style.cursor = 'grab';
        const heldLongEnough = active === 'map' || performance.now() - state.dragStartTime >= POINTER_DRAG_DELAY_MS;
        if (!heldLongEnough || !state.dragMoved) return;
        state.dragActive = true;
        state.lastX = event.clientX;
        state.lastY = event.clientY;
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      renderer.domElement.style.cursor = 'grabbing';
      state.dragMoved = true;

      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      if (active === 'timeline') {
        state.timelineOrbit = THREE.MathUtils.clamp(
          state.timelineOrbit + dx * 0.0015,
          -TIMELINE_ORBIT_LIMIT,
          TIMELINE_ORBIT_LIMIT
        );
        state.timelineHeight = THREE.MathUtils.clamp(state.timelineHeight + dy * 0.32, -70, 82);
      } else if (active === 'map') {
        const dragScale = 1 / Math.max(0.2, state.mapZoomTarget);
        state.mapPanTarget.x += dx * dragScale;
        state.mapPanTarget.y -= dy * dragScale;
        clampMapPan(state.mapPanTarget, state.mapZoomTarget);
      } else {
        state.yaw -= dx * 0.004;
        state.pitch = THREE.MathUtils.clamp(state.pitch + dy * 0.004, -0.8, 0.8);
      }

      state.lastX = event.clientX;
      state.lastY = event.clientY;
    }

    function onPointerUp(event) {
      const movedDistance = Math.hypot(
        event.clientX - state.dragStartX,
        event.clientY - state.dragStartY
      );
      const isMapLayout = latest.current.activeLayout === 'map';
      const shouldSuppressClick = isMapLayout
        ? state.dragActive && movedDistance > MAP_CLICK_MOVE_TOLERANCE
        : state.dragMoved;
      state.dragging = false;
      state.dragActive = false;
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released if the browser interrupted the drag.
      }
      if (shouldSuppressClick) return;
      if (isUiPointer(event)) return;
      if (isMapLayout) {
        const locationHit = pickMapLocation(event);
        const locationId = getMapHitLocationId(locationHit);
        if (locationId) {
          latest.current.onMapLocationSelect?.(locationId);
          return;
        }
      }
      const hit = pick(event);
      if (latest.current.activeLayout === 'timeline') {
        const holderGroupId = getTimelineHitGroupId(hit);
        if (holderGroupId && latest.current.timelineGroupId !== holderGroupId) {
          latest.current.onTimelineGroupSelect?.(holderGroupId);
          return;
        }
        const hitItem = getTimelineHitItem(hit);
        if (!hitItem) {
          latest.current.onTimelineGroupClear?.();
          return;
        }
        const groupId = getTimelineGroupKey(hitItem);
        if (latest.current.timelineGroupId !== groupId) {
          latest.current.onTimelineGroupSelect?.(groupId);
          return;
        }
      }
      const hitItem = getTimelineHitItem(hit);
      if (hitItem) {
        latest.current.onSelect(hitItem.id);
        return;
      }
      if (latest.current.activeLayout === 'map') {
        const locationId = getMapHitLocationId(hit);
        if (locationId) {
          latest.current.onMapLocationSelect?.(locationId);
          return;
        }
        latest.current.onMapLocationClear?.();
      }
    }

    function onWheel(event) {
      if (latest.current.activeLayout === 'timeline') {
        event.preventDefault();
        return;
      }
      if (latest.current.activeLayout === 'map') {
        event.preventDefault();
        const previousZoom = state.mapZoomTarget;
        const nextZoom = THREE.MathUtils.clamp(
          previousZoom * Math.exp(-event.deltaY * 0.0012),
          XIANGDONG_MAP_MIN_ZOOM,
          XIANGDONG_MAP_MAX_ZOOM
        );
        const zoomRatio = nextZoom / previousZoom;
        state.mapZoomTarget = nextZoom;
        state.mapPanTarget.multiplyScalar(zoomRatio);
        clampMapPan(state.mapPanTarget, state.mapZoomTarget);
        return;
      }
      state.distance = THREE.MathUtils.clamp(state.distance + event.deltaY * 0.32, 440, 1040);
    }

    function onKeyDown(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') return;
      const key = event.key.toLowerCase();
      if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) return;
      if (latest.current.activeLayout !== 'timeline') return;
      event.preventDefault();
      state.keys.add(key);
    }

    function onKeyUp(event) {
      state.keys.delete(event.key.toLowerCase());
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);

    resize();
    animate();

    return () => {
      cancelAnimationFrame(state.frame);
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      mount.removeChild(renderer.domElement);
      disposeThreeObject(scene);
      renderer.dispose();
    };
  }, []);

  return <section className="space-canvas" ref={mountRef} aria-label="3D 西湖漫游" />;
}

function createCardObject(item, selected) {
  const type = typeMap[item.type];
  const group = new THREE.Group();
  group.userData.item = item;
  group.userData.textureSelected = selected;

  const shellMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(type.color).lerp(new THREE.Color(0x071018), 0.68),
    transparent: true,
    opacity: 0.46,
    depthWrite: false,
    depthTest: true,
    fog: false
  });
  shellMaterial.userData.baseOpacity = 0.46;

  const shell = new THREE.Mesh(new THREE.BoxGeometry(74, 98, 4.6), shellMaterial);
  shell.name = 'card-3d-shell';
  group.add(shell);

  const rimMaterial = new THREE.MeshBasicMaterial({
    color: type.color,
    transparent: true,
    opacity: selected ? 0.44 : 0.32,
    depthWrite: false,
    depthTest: true,
    fog: false
  });
  rimMaterial.userData.baseOpacity = selected ? 0.44 : 0.32;

  const rim = new THREE.Mesh(new THREE.BoxGeometry(78, 102, 2.2), rimMaterial);
  rim.name = 'card-3d-rim';
  rim.position.z = -1.6;
  group.add(rim);

  const frontMaterial = new THREE.MeshBasicMaterial({
    map: makeObjectTexture(item, selected),
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    fog: false,
    depthTest: true,
    depthWrite: false
  });
  frontMaterial.userData.baseOpacity = 0.98;

  const front = new THREE.Mesh(new THREE.PlaneGeometry(70, 94, 1, 1), frontMaterial);
  front.name = 'card-3d-front';
  front.position.z = 2.45;
  group.add(front);

  group.userData.cardFront = front;
  group.userData.cardRim = rim;
  group.traverse(child => {
    child.userData.item = item;
  });
  requestCardAssetRefresh(group, item, selected);
  return group;
}

function updateCardObjectTexture(card, item, selected) {
  const front = card.userData.cardFront;
  if (!front?.material) return;
  const oldMap = front.material.map;
  front.material.map = makeObjectTexture(item, selected);
  front.material.needsUpdate = true;
  oldMap?.dispose?.();

  const rim = card.userData.cardRim;
  if (rim?.material) {
    rim.material.opacity = selected ? 0.44 : 0.32;
    rim.material.userData.baseOpacity = selected ? 0.44 : 0.32;
    rim.material.needsUpdate = true;
  }
  card.userData.textureSelected = selected;
  requestCardAssetRefresh(card, item, selected);
}

function requestCardAssetRefresh(card, item, selected) {
  const asset = getItemAsset(item);
  requestAssetImage(asset, () => {
    if (!card.parent && !card.userData?.cardFront) return;
    const front = card.userData.cardFront;
    if (!front?.material) return;
    const oldMap = front.material.map;
    front.material.map = makeObjectTexture(item, card.userData.textureSelected ?? selected);
    front.material.needsUpdate = true;
    oldMap?.dispose?.();
  });
}

function setCardObjectDepthTest(card, depthTest) {
  card.traverse(child => {
    if (!child.material) return;
    child.material.depthTest = depthTest;
    child.material.needsUpdate = true;
  });
}

function setCardObjectOpacity(card, opacity) {
  card.traverse(child => {
    if (!child.material) return;
    child.material.opacity = (child.material.userData.baseOpacity ?? child.material.opacity) * opacity;
    child.material.needsUpdate = true;
  });
}

function makeObjectTexture(item, selected) {
  const type = typeMap[item.type];
  const textureScale = 3;
  const logicalWidth = 768;
  const logicalHeight = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * textureScale;
  canvas.height = logicalHeight * textureScale;
  const ctx = canvas.getContext('2d');
  ctx.scale(textureScale, textureScale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const bg = ctx.createLinearGradient(0, 0, logicalWidth, logicalHeight);
  bg.addColorStop(0, rgba(type.color, selected ? 0.46 : 0.34));
  bg.addColorStop(0.36, '#151922');
  bg.addColorStop(1, '#06080d');
  round(ctx, 0, 0, logicalWidth, logicalHeight, 38);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  round(ctx, 28, 28, 712, 648, 26);
  ctx.clip();
  const asset = getItemAsset(item);
  const assetImage = getLoadedAssetImage(asset);
  if (assetImage) {
    drawImageCover(ctx, assetImage, 28, 28, 712, 648);
    const photoShade = ctx.createLinearGradient(28, 28, 28, 676);
    photoShade.addColorStop(0, 'rgba(0,0,0,.05)');
    photoShade.addColorStop(0.74, 'rgba(0,0,0,.1)');
    photoShade.addColorStop(1, 'rgba(0,0,0,.38)');
    ctx.fillStyle = photoShade;
    ctx.fillRect(28, 28, 712, 648);
  } else {
    drawTextureArt(ctx, item, 28, 28, 712, 648);
  }
  ctx.restore();

  const panel = ctx.createLinearGradient(0, 672, 0, 1010);
  panel.addColorStop(0, 'rgba(5,8,13,.64)');
  panel.addColorStop(0.34, 'rgba(4,7,12,.94)');
  panel.addColorStop(1, 'rgba(3,5,9,.98)');
  ctx.fillStyle = panel;
  round(ctx, 30, 670, 708, 326, 26);
  ctx.fill();

  ctx.strokeStyle = selected ? '#ffffff' : rgba(type.color, 0.86);
  ctx.lineWidth = selected ? 8 : 5;
  round(ctx, 5, 5, 758, 1014, 38);
  ctx.stroke();

  const cardTitle = getReadableLocationName(item.location);
  const cardTopic = item.title === cardTitle ? item.material : item.title;

  ctx.fillStyle = 'rgba(255,255,255,.98)';
  ctx.font = '800 76px "Microsoft YaHei", Arial, sans-serif';
  wrapText(ctx, cardTitle, 50, 766, 602, 82, 2);

  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.font = '700 34px "Microsoft YaHei", Arial, sans-serif';
  wrapText(ctx, `${cardTopic} / ${item.year}`, 52, 922, 560, 38, 1);
  ctx.fillStyle = 'rgba(255,255,255,.56)';
  ctx.font = '600 28px "Microsoft YaHei", Arial, sans-serif';
  ctx.fillText(item.material, 52, 962);

  ctx.fillStyle = type.color;
  ctx.beginPath();
  ctx.arc(692, 916, 20, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

function createTimelineHolderObject(group, expanded) {
  const holder = new THREE.Group();
  holder.userData.timelineGroupId = group.id;
  holder.userData.textureKey = `${group.id}-${expanded}`;
  populateTimelineHolderObject(holder, group, expanded);
  return holder;
}

function populateTimelineHolderObject(holder, group, expanded) {
  while (holder.children.length) {
    const child = holder.children.pop();
    disposeThreeObject(child);
  }

  const trayY = expanded ? -38 : -6;
  const trayScale = expanded ? 0.75 : 0.58;
  const floorGlow = new THREE.Group();
  floorGlow.name = 'timeline-package-floor-glow-wrap';
  floorGlow.position.y = trayY;
  floorGlow.scale.setScalar(trayScale);
  floorGlow.add(createPackageFloorGlowObject({
    namePrefix: 'timeline-package',
    width: expanded ? 320 : 260,
    depth: expanded ? 96 : 78,
    opacity: expanded ? 0.18 : 0.22
  }));
  holder.add(floorGlow);

  const tray = createPackageTrayObject({
    labelTexture: makeTimelineLabelTexture(group, expanded),
    labelWidth: expanded ? 72 : 58,
    labelHeight: expanded ? 26 : 22,
    labelPosition: new THREE.Vector3(0, PACKAGE_TRAY.frontLipHeight / 2 + 7.5, PACKAGE_TRAY.labelZ + 1),
    labelOpacity: expanded ? 0.94 : 0.98,
    labelDepthTest: false,
    trayGlowOpacity: 0,
    hoverGlowOpacity: 0,
    namePrefix: 'timeline-package'
  });
  tray.name = 'timeline-package-tray';
  tray.position.y = trayY;
  tray.scale.setScalar(trayScale);
  tray.traverse(child => {
    if (!child.material?.isMeshStandardMaterial) return;
    child.material.opacity = Math.min(expanded ? 0.42 : 0.38, child.material.opacity * (expanded ? 0.9 : 0.82));
    child.material.emissiveIntensity = expanded ? 0.46 : 0.38;
    child.material.userData.baseOpacity = child.material.opacity;
    child.material.needsUpdate = true;
  });
  simplifyTimelineTrayObject(tray, expanded);
  holder.add(tray);

  holder.add(createTimelineTrayLightObject(expanded, trayY, trayScale));

  const seat = createTimelineCardSeatObject(group, expanded, trayY, trayScale);
  holder.add(seat);

  const hitTarget = new THREE.Mesh(
    new THREE.PlaneGeometry(expanded ? 210 : 150, expanded ? 116 : 96, 1, 1),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  hitTarget.name = 'timeline-year-hit-target';
  hitTarget.position.set(0, expanded ? -18 : 16, PACKAGE_TRAY.labelZ + 4);
  holder.add(hitTarget);

  holder.traverse(child => {
    child.userData.timelineGroupId = group.id;
    if (child.material) child.material.userData.baseOpacity ??= child.material.opacity;
  });
}

function simplifyTimelineTrayObject(tray, expanded) {
  const rearLip = tray.getObjectByName('timeline-package-rear-lip');
  if (rearLip) rearLip.visible = false;
  const leftLip = tray.getObjectByName('timeline-package-side-lip-left');
  const rightLip = tray.getObjectByName('timeline-package-side-lip-right');
  [leftLip, rightLip].forEach(part => {
    if (!part) return;
    part.visible = true;
    part.traverse(child => {
      if (!child.material?.isMeshStandardMaterial) return;
      const opacity = expanded ? 0.14 : 0.11;
      child.material.opacity = opacity;
      child.material.userData.baseOpacity = opacity;
      child.material.emissiveIntensity = expanded ? 0.18 : 0.15;
      child.material.needsUpdate = true;
    });
  });

  [
    ['timeline-package-bottom-shelf', expanded ? 0.5 : 0.44],
    ['timeline-package-front-lip', expanded ? 0.64 : 0.56]
  ].forEach(([name, opacity]) => {
    const part = tray.getObjectByName(name);
    part?.traverse(child => {
      if (!child.material?.isMeshStandardMaterial) return;
      child.material.opacity = opacity;
      child.material.userData.baseOpacity = opacity;
      child.material.emissiveIntensity = expanded ? 0.3 : 0.25;
      child.material.needsUpdate = true;
    });
  });
}

function updateTimelineHolderObject(holder, group, expanded) {
  holder.userData.timelineGroupId = group.id;
  populateTimelineHolderObject(holder, group, expanded);
}

function createRoundedPanel(width, height, radius, color, opacity) {
  const mesh = new THREE.Mesh(
    makeRoundedRectGeometry(width, height, radius),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  mesh.material.userData.baseOpacity = opacity;
  return mesh;
}

function createTimelineLine(x1, y1, x2, y2, color, opacity) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y1, 14),
      new THREE.Vector3(x2, y2, 14)
    ]),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  line.material.userData.baseOpacity = opacity;
  return line;
}

function pulsePackageCardSeat(seat, pulse = 1) {
  seat.traverse(child => {
    if (!child.material) return;
    const baseOpacity = child.material.userData.baseOpacity ?? child.material.opacity;
    if (child.name.includes('slot-glow') || child.name.includes('socket-line') || child.name.includes('guard-edge')) {
      child.material.opacity = baseOpacity * pulse;
      child.material.needsUpdate = true;
    }
  });
}

function createPackageCardSeatObject({
  accent = 0x28f4ff,
  expanded = false,
  trayY = 0,
  trayScale = 1,
  guardHeight = 0,
  showSlotGlow = true,
  showSocketLine = true,
  showSeatStroke = true,
  showSeatShadow = true,
  slotGlowOpacity = null,
  seatShadowOpacity = null,
  namePrefix = 'package'
} = {}) {
  const seat = new THREE.Group();
  seat.name = `${namePrefix}-card-seat`;

  if (showSlotGlow) {
    const slotGlow = new THREE.Mesh(
      new THREE.PlaneGeometry((expanded ? 282 : 214) * trayScale, (expanded ? 104 : 82) * trayScale),
      new THREE.MeshBasicMaterial({
        map: createPackageGlowTexture(),
        transparent: true,
        opacity: slotGlowOpacity ?? (expanded ? 0.72 : 0.84),
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        fog: false
      })
    );
    slotGlow.name = `${namePrefix}-card-slot-glow`;
    slotGlow.rotation.x = -Math.PI / 2;
    slotGlow.position.set(0, trayY + 7 * trayScale, 24 * trayScale);
    slotGlow.material.userData.baseOpacity = slotGlow.material.opacity;
    slotGlow.raycast = () => {};
    seat.add(slotGlow);
  }

  if (showSocketLine) {
    const socketLine = new THREE.Mesh(
      new THREE.PlaneGeometry((expanded ? 154 : 124) * trayScale, 5 * trayScale),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: expanded ? 0.62 : 0.72,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        fog: false
      })
    );
    socketLine.name = `${namePrefix}-card-socket-line`;
    socketLine.position.set(0, trayY + 16 * trayScale, 38 * trayScale);
    socketLine.material.userData.baseOpacity = socketLine.material.opacity;
    socketLine.raycast = () => {};
    seat.add(socketLine);
  }

  if (showSeatShadow) {
    const seatShadow = new THREE.Mesh(
      new THREE.PlaneGeometry((expanded ? 172 : 132) * trayScale, (expanded ? 30 : 24) * trayScale),
      new THREE.MeshBasicMaterial({
        map: makeTimelineSeatMaskTexture(accent, expanded, showSeatStroke),
        transparent: true,
        opacity: seatShadowOpacity ?? (expanded ? 0.72 : 0.8),
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        fog: false
      })
    );
    seatShadow.name = `${namePrefix}-card-seat-shadow`;
    seatShadow.position.set(0, trayY + 22 * trayScale, (PACKAGE_TRAY.frontZ + 8) * trayScale);
    seatShadow.material.userData.baseOpacity = seatShadow.material.opacity;
    seatShadow.raycast = () => {};
    seat.add(seatShadow);
  }

  if (guardHeight > 0) {
    const guardVisualHeight = THREE.MathUtils.clamp(guardHeight * (expanded ? 0.46 : 0.22), 12, 34);
    const guardWidth = (expanded ? 318 : 146) * trayScale;
    const frontGuard = new THREE.Mesh(
      new THREE.PlaneGeometry(guardWidth, guardVisualHeight * trayScale),
      new THREE.MeshBasicMaterial({
        map: makePackageFrontGuardTexture(accent),
        transparent: true,
        opacity: expanded ? 0.92 : 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        fog: false
      })
    );
    frontGuard.name = `${namePrefix}-front-guard`;
    const guardBaseY = expanded ? 14 : 7;
    frontGuard.position.set(0, trayY + (guardBaseY + guardVisualHeight / 2) * trayScale, (PACKAGE_TRAY.frontZ + 10.5) * trayScale);
    frontGuard.material.userData.baseOpacity = frontGuard.material.opacity;
    frontGuard.raycast = () => {};
    seat.add(frontGuard);

    const guardEdge = new THREE.Mesh(
      new THREE.PlaneGeometry(guardWidth * 0.82, 2.4 * trayScale),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: expanded ? 0.72 : 0.62,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
        fog: false
      })
    );
    guardEdge.name = `${namePrefix}-guard-edge`;
    guardEdge.position.set(0, trayY + (guardBaseY + guardVisualHeight) * trayScale, (PACKAGE_TRAY.frontZ + 10.9) * trayScale);
    guardEdge.material.userData.baseOpacity = guardEdge.material.opacity;
    guardEdge.raycast = () => {};
    seat.add(guardEdge);
  }

  return seat;
}

function createTimelineCardSeatObject(group, expanded, trayY, trayScale) {
  return createPackageCardSeatObject({
    accent: 0x28f4ff,
    expanded,
    trayY,
    trayScale,
    showSlotGlow: false,
    showSocketLine: false,
    showSeatStroke: false,
    showSeatShadow: false,
    namePrefix: 'timeline'
  });
}

function createTimelineTrayLightObject(expanded, trayY, trayScale) {
  const light = new THREE.Group();
  light.name = 'timeline-inner-light';

  const floorSpill = new THREE.Mesh(
    new THREE.PlaneGeometry((expanded ? 178 : 146) * trayScale, (expanded ? 78 : 62) * trayScale),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: expanded ? 0.48 : 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  floorSpill.name = 'timeline-inner-light-floor-spill';
  floorSpill.rotation.x = -Math.PI / 2;
  floorSpill.position.set(0, trayY + 9 * trayScale, 13 * trayScale);
  floorSpill.material.userData.baseOpacity = floorSpill.material.opacity;
  floorSpill.raycast = () => {};
  light.add(floorSpill);

  const core = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeTimelineEmitterTexture(),
      transparent: true,
      opacity: expanded ? 0.7 : 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  core.name = 'timeline-inner-light-core';
  core.scale.set((expanded ? 92 : 72) * trayScale, (expanded ? 46 : 36) * trayScale, 1);
  core.position.set(0, trayY + 21 * trayScale, 13 * trayScale);
  core.material.userData.baseOpacity = core.material.opacity;
  core.raycast = () => {};
  light.add(core);

  const bloom = new THREE.Mesh(
    new THREE.PlaneGeometry((expanded ? 228 : 184) * trayScale, (expanded ? 92 : 72) * trayScale),
    new THREE.MeshBasicMaterial({
      map: createPackageGlowTexture(),
      transparent: true,
      opacity: expanded ? 0.42 : 0.34,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  bloom.name = 'timeline-inner-light-bloom';
  bloom.rotation.x = -Math.PI / 2;
  bloom.position.set(0, trayY + 10 * trayScale, 13 * trayScale);
  bloom.material.userData.baseOpacity = bloom.material.opacity;
  bloom.raycast = () => {};
  light.add(bloom);

  const airGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeTimelineEmitterTexture(),
      transparent: true,
      opacity: expanded ? 0.36 : 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  airGlow.name = 'timeline-inner-light-air-glow';
  airGlow.scale.set((expanded ? 156 : 124) * trayScale, (expanded ? 72 : 58) * trayScale, 1);
  airGlow.position.set(0, trayY + 25 * trayScale, 16 * trayScale);
  airGlow.material.userData.baseOpacity = airGlow.material.opacity;
  airGlow.raycast = () => {};
  light.add(airGlow);

  const frontWash = new THREE.Mesh(
    new THREE.PlaneGeometry((expanded ? 156 : 122) * trayScale, (expanded ? 36 : 28) * trayScale),
    new THREE.MeshBasicMaterial({
      map: makeTimelineEmitterTexture(),
      transparent: true,
      opacity: expanded ? 0.16 : 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  frontWash.name = 'timeline-inner-light-front-wash';
  frontWash.position.set(0, trayY + 17 * trayScale, (PACKAGE_TRAY.frontZ - 8) * trayScale);
  frontWash.material.userData.baseOpacity = frontWash.material.opacity;
  frontWash.raycast = () => {};
  light.add(frontWash);

  return light;
}

function makeTimelineEmitterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(256, 96);
  ctx.scale(2.05, 0.68);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 118);
  glow.addColorStop(0, 'rgba(238,255,255,.68)');
  glow.addColorStop(0.22, 'rgba(94,252,255,.48)');
  glow.addColorStop(0.52, 'rgba(40,244,255,.24)');
  glow.addColorStop(0.78, 'rgba(40,244,255,.085)');
  glow.addColorStop(1, 'rgba(40,244,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-260, -160, 520, 320);
  ctx.restore();

  ctx.save();
  ctx.translate(256, 96);
  ctx.scale(1.3, 0.34);
  const core = ctx.createRadialGradient(0, 0, 2, 0, 0, 72);
  core.addColorStop(0, 'rgba(252,255,255,.58)');
  core.addColorStop(0.4, 'rgba(112,254,255,.34)');
  core.addColorStop(0.82, 'rgba(40,244,255,.09)');
  core.addColorStop(1, 'rgba(40,244,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(-160, -100, 320, 200);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function makeTimelineSeatMaskTexture(accent, expanded, showStroke = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const shade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  if (showStroke) {
    shade.addColorStop(0, 'rgba(1,4,9,0)');
    shade.addColorStop(0.28, rgba(accent, expanded ? 0.18 : 0.24));
    shade.addColorStop(0.58, 'rgba(2,8,14,.62)');
    shade.addColorStop(1, 'rgba(0,0,0,.86)');
  } else {
    shade.addColorStop(0, 'rgba(1,4,9,0)');
    shade.addColorStop(0.24, rgba(accent, expanded ? 0.38 : 0.32));
    shade.addColorStop(0.58, rgba(accent, expanded ? 0.22 : 0.18));
    shade.addColorStop(1, 'rgba(1,12,18,.18)');
  }
  ctx.fillStyle = shade;
  round(ctx, 6, 4, canvas.width - 12, canvas.height - 8, 24);
  ctx.fill();

  if (showStroke) {
    ctx.shadowColor = rgba(accent, 0.62);
    ctx.shadowBlur = 18;
    ctx.strokeStyle = rgba(accent, expanded ? 0.78 : 0.9);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(36, 74);
    ctx.lineTo(canvas.width - 36, 74);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function makePackageFrontGuardTexture(accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const glass = ctx.createLinearGradient(0, 0, 0, canvas.height);
  glass.addColorStop(0, rgba(accent, 0.2));
  glass.addColorStop(0.42, 'rgba(3,12,18,.64)');
  glass.addColorStop(1, 'rgba(0,0,0,.84)');
  ctx.fillStyle = glass;
  round(ctx, 8, 8, canvas.width - 16, canvas.height - 16, 24);
  ctx.fill();

  ctx.strokeStyle = rgba(accent, 0.66);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(42, 34);
  ctx.lineTo(canvas.width - 42, 34);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(245,251,255,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(54, 52);
  ctx.lineTo(canvas.width - 54, 52);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function makeRoundedRectGeometry(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(shape, 8);
}

function makeTimelineLabelTexture(group, expanded) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = 'rgba(40,244,255,.52)';
  ctx.shadowBlur = expanded ? 20 : 16;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = 'rgba(245,251,255,.96)';
  ctx.font = `${expanded ? 124 : 112}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(group.label, canvas.width / 2, canvas.height / 2 + 4);
  const yearOnlyTexture = new THREE.CanvasTexture(canvas);
  yearOnlyTexture.colorSpace = THREE.SRGBColorSpace;
  yearOnlyTexture.generateMipmaps = true;
  yearOnlyTexture.minFilter = THREE.LinearMipmapLinearFilter;
  yearOnlyTexture.magFilter = THREE.LinearFilter;
  yearOnlyTexture.anisotropy = 8;
  return yearOnlyTexture;
  ctx.fillStyle = expanded ? 'rgba(40,244,255,.86)' : 'rgba(245,251,255,.72)';
  ctx.font = '40px "Microsoft YaHei", Arial, sans-serif';
  ctx.fillText(`${group.items.length} 条线索`, 22, 170);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function setTimelineHolderOpacity(holder, opacity) {
  holder.traverse(child => {
    if (!child.material) return;
    child.material.opacity = (child.material.userData.baseOpacity ?? child.material.opacity) * opacity;
    child.material.needsUpdate = true;
  });
}

function updateTimelineHolderGlowPulse(holder, group, expanded, holderOpacity, time) {
  const phase = seeded(group.id, 217) * TAU;
  const wave = 0.5 + 0.5 * Math.sin(time * (expanded ? 2.6 : 2.1) + phase);
  const snap = Math.pow(
    0.5 + 0.5 * Math.sin(time * TIMELINE_FLASH_RATE + phase * 1.7),
    TIMELINE_FLASH_SHARPNESS
  );
  const slotPulse = expanded ? 0.9 + wave * 0.14 + snap * 0.1 : 0.94 + wave * 0.16 + snap * 0.12;
  const cardPulse = expanded ? 0.8 + wave * 0.12 + snap * 0.07 : 0.84 + wave * 0.14 + snap * 0.08;
  const socketPulse = expanded ? 0.82 + wave * 0.12 + snap * 0.08 : 0.86 + wave * 0.13 + snap * 0.09;
  const innerPulse = expanded ? 0.92 + wave * 0.1 + snap * 0.06 : 0.94 + wave * 0.09 + snap * 0.06;

  holder.traverse(child => {
    if (!child.material) return;
    const baseOpacity = child.material.userData.baseOpacity ?? child.material.opacity;
    if (child.name === 'timeline-package-tray-glow') {
      child.material.opacity = baseOpacity * holderOpacity * slotPulse;
      child.material.needsUpdate = true;
    } else if (child.name === 'timeline-package-hover-glow') {
      child.material.opacity = baseOpacity * holderOpacity * cardPulse;
      child.material.needsUpdate = true;
    } else if (child.name === 'timeline-card-slot-glow' || child.name === 'timeline-card-socket-line') {
      child.material.opacity = baseOpacity * holderOpacity * socketPulse;
      child.material.needsUpdate = true;
    } else if (child.name.startsWith('timeline-inner-light')) {
      child.material.opacity = baseOpacity * holderOpacity * innerPulse;
      child.material.needsUpdate = true;
    }
  });
}

function setTimelineHolderRenderOrder(holder, renderOrder) {
  holder.renderOrder = renderOrder;
  holder.traverse((child, index) => {
    if (child.name === 'timeline-card-seat-shadow') {
      child.renderOrder = renderOrder + 260;
    } else if (child.name === 'timeline-card-socket-line') {
      child.renderOrder = renderOrder + 235;
    } else if (child.name === 'timeline-package-tray-label') {
      child.renderOrder = renderOrder + 180;
    } else if (child.material?.isMeshStandardMaterial) {
      child.renderOrder = renderOrder + 120;
    } else if (child.name.startsWith('timeline-inner-light')) {
      child.renderOrder = renderOrder + 70;
    } else if (child.name === 'timeline-card-slot-glow') {
      child.renderOrder = renderOrder + 40;
    } else {
      child.renderOrder = renderOrder + index;
    }
  });
}

function getTimelineHitGroupId(object) {
  let current = object;
  while (current) {
    if (current.userData?.timelineGroupId) return current.userData.timelineGroupId;
    current = current.parent;
  }
  return null;
}

function getTimelineHitItem(object) {
  let current = object;
  while (current) {
    if (current.userData?.item) return current.userData.item;
    current = current.parent;
  }
  return null;
}

function disposeThreeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(material => {
        material.map?.dispose?.();
        material.dispose?.();
      });
    } else {
      child.material?.map?.dispose?.();
      child.material?.dispose?.();
    }
  });
}

function makeTimelineHolderTexture(group, expanded) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const palette = ['#74d36d', '#8a82dc', '#ef9418', '#e4c616', '#5fc9c2', '#d05048', '#3d67c8'];
  const accent = expanded ? '#28f4ff' : palette[group.groupIndex % palette.length];
  const slotOnRight = getTimelineGroupSide(group) < 0;
  const labelX = slotOnRight ? 78 : 424;
  const slotStart = slotOnRight ? 438 : 226;
  ctx.lineJoin = 'round';

  const base = ctx.createLinearGradient(0, 106, 0, 352);
  base.addColorStop(0, rgba(accent, expanded ? 0.18 : 0.09));
  base.addColorStop(0.5, 'rgba(8, 17, 28, .38)');
  base.addColorStop(1, 'rgba(2, 5, 11, .46)');

  ctx.shadowColor = rgba(accent, expanded ? 0.48 : 0.34);
  ctx.shadowBlur = expanded ? 28 : 18;
  round(ctx, 40, 136, 688, 198, 30);
  ctx.fillStyle = base;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(accent, expanded ? 0.86 : 0.58);
  ctx.lineWidth = expanded ? 5 : 3;
  ctx.stroke();

  const backRim = ctx.createLinearGradient(0, 82, 0, 150);
  backRim.addColorStop(0, 'rgba(255,255,255,.28)');
  backRim.addColorStop(1, rgba(accent, 0.12));
  round(ctx, 60, 92, 648, 72, 24);
  ctx.fillStyle = backRim;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.24)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const pocket = ctx.createLinearGradient(0, 192, 0, 330);
  pocket.addColorStop(0, rgba(accent, 0.16));
  pocket.addColorStop(0.4, 'rgba(6, 14, 23, .48)');
  pocket.addColorStop(1, 'rgba(1, 4, 9, .64)');
  round(ctx, 50, 202, 668, 132, 26);
  ctx.fillStyle = pocket;
  ctx.fill();
  ctx.strokeStyle = rgba(accent, expanded ? 0.8 : 0.48);
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,.22)';
  round(ctx, 84, 276, 600, 28, 14);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 205);
  ctx.lineTo(40, 158);
  ctx.moveTo(698, 205);
  ctx.lineTo(728, 158);
  ctx.stroke();

  ctx.fillStyle = 'rgba(248,252,255,.96)';
  ctx.font = '800 52px "Segoe UI", Arial, sans-serif';
  ctx.fillText(group.label, labelX, 258);
  ctx.fillStyle = 'rgba(245,251,255,.74)';
  ctx.font = '26px "Microsoft YaHei", Arial, sans-serif';
  ctx.fillText(`${group.items.length} 条线索`, labelX + 2, 294);

  const slotCount = Math.min(7, group.items.length);
  for (let i = 0; i < slotCount; i += 1) {
    const x = slotStart + i * 26;
    const y = 154 - i * 7;
    round(ctx, x, y, 78, 104, 10);
    const cardFill = ctx.createLinearGradient(x, y, x + 78, y + 104);
    cardFill.addColorStop(0, 'rgba(255,255,255,.14)');
    cardFill.addColorStop(0.48, rgba(accent, i % 2 ? 0.08 : 0.14));
    cardFill.addColorStop(1, 'rgba(4,8,13,.14)');
    ctx.fillStyle = cardFill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.34)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

function getLayoutTarget(item, layoutItems, activeLayout, time, focusBlend = 0, layoutKey = 'overview-base', relayoutPulse = 0, timelineGroupId = null, timelineFlow = 0) {
  if (activeLayout === 'timeline') return getTimelineTarget(item, layoutItems, time, focusBlend, relayoutPulse, timelineGroupId, timelineFlow);
  if (activeLayout === 'map') return getMapTarget(item, time, focusBlend, relayoutPulse);
  return getSphereTarget(item, layoutItems, time, focusBlend, layoutKey, relayoutPulse);
}

function getLayoutTransitionMix(transition) {
  if (!transition) return 1;
  const t = THREE.MathUtils.clamp(transition.elapsed / Math.max(0.001, transition.duration), 0, 1);
  return t * t * (3 - 2 * t);
}

function getLayoutGuideOpacity(layout, activeLayout, transition, transitionMix) {
  if (!transition) return activeLayout === layout ? 1 : 0;
  if (transition.to === layout) return transitionMix;
  if (transition.from === layout) return 1 - transitionMix;
  return activeLayout === layout ? 1 : 0;
}

function setParticleFieldOpacity(field, opacity) {
  const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
  field.visible = clamped > 0.01;
  if (field.material) {
    field.material.userData.baseOpacity ??= field.material.opacity ?? 1;
    field.material.opacity = field.material.userData.baseOpacity * clamped;
    field.material.needsUpdate = true;
  }
}

function setGuideOpacity(guide, opacity) {
  const clamped = THREE.MathUtils.clamp(opacity, 0, 1);
  guide.visible = clamped > 0.01;
  guide.traverse(child => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach(material => {
      material.userData.baseOpacity ??= material.opacity ?? 1;
      material.transparent = true;
      material.opacity = material.userData.baseOpacity * clamped;
      material.needsUpdate = true;
    });
  });
}

function getSphereTarget(item, orbitItems, time, focusBlend = 0, layoutKey = 'overview-base', relayoutPulse = 0) {
  const ordered = [...orbitItems].sort((a, b) => getItemNumber(a) - getItemNumber(b));
  const count = Math.max(1, ordered.length);
  const index = Math.max(0, ordered.findIndex(entry => entry.id === item.id));
  const shuffledIndex = getControlledSlotIndex(index, count, layoutKey);
  const overview = getSphereSlot(index, count);
  const rearranged = getSphereSlot(shuffledIndex, count);
  const target = overview.lerp(rearranged, focusBlend).multiplyScalar(1 + focusBlend * 0.035);
  const pulse = layoutKey.endsWith('-base') ? 0 : Math.sin(relayoutPulse * Math.PI);

  if (pulse > 0.001) {
    const tangent = new THREE.Vector3(-target.z, 0, target.x).normalize();
    target.addScaledVector(tangent, (seeded(`${layoutKey}-${item.id}`, 84) - 0.5) * 70 * pulse);
    target.y += (seeded(`${layoutKey}-${item.id}`, 85) - 0.5) * 42 * pulse;
  }

  target.applyAxisAngle(new THREE.Vector3(0, 1, 0), time * SPHERE_ROTATION_SPEED);
  target.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.sin(time * 0.05) * 0.12);
  return target;
}

function getTimelineTarget(
  item,
  layoutItems,
  time,
  focusBlend = 0,
  relayoutPulse = 0,
  timelineGroupId = null,
  timelineFlow = 0,
  timelineHolder = null
) {
  const meta = getTimelineGroupMeta(item, layoutItems);
  const visual = getTimelineVisualModel(meta, timelineGroupId);
  const basis = visual.basis;
  const hasTimelineHolder = Boolean(timelineHolder?.position && timelineHolder?.quaternion && timelineHolder?.scale);
  const origin = hasTimelineHolder ? timelineHolder.position.clone() : visual.target.clone();
  const pulse = Math.sin(relayoutPulse * Math.PI);
  const deckIndex = meta.itemIndex - (meta.groupItems.length - 1) / 2;
  const isExpanded = timelineGroupId === meta.id;
  const depthFocus = getTimelineDepthFocus(meta.progress - timelineFlow, isExpanded);
  const localDepthScale = hasTimelineHolder ? 1 : getTimelineLocalDepthScale(depthFocus, isExpanded);

  let localOffset;
  if (isExpanded) {
    const visibleIndex = meta.itemIndex - (meta.groupItems.length - 1) / 2;
    const fanWidth = Math.min(52, 244 / Math.max(1, meta.groupItems.length - 1));
    const localDepth = 64 + Math.abs(visibleIndex) * 4;
    localOffset = new THREE.Vector3(
      visibleIndex * fanWidth,
      42 - Math.abs(visibleIndex) * 2,
      localDepth
    );
  } else {
    const localX = deckIndex * 1.6;
    const localUp = 44 - meta.itemIndex * 0.38;
    const localDepth = 24 - meta.itemIndex * 1.9;
    localOffset = new THREE.Vector3(
      localX * localDepthScale,
      localUp * localDepthScale,
      localDepth * localDepthScale
    );
  }

  if (pulse > 0.001) {
    localOffset.x += (seeded(item.id, 94) - 0.5) * (isExpanded ? 18 : 28) * pulse;
  }

  if (hasTimelineHolder) {
    localOffset.multiply(timelineHolder.scale).applyQuaternion(timelineHolder.quaternion);
    return origin.add(localOffset);
  }

  const target = origin
    .addScaledVector(basis.right, localOffset.x)
    .addScaledVector(basis.up, localOffset.y)
    .addScaledVector(basis.tangent, -localOffset.z);
  target.multiplyScalar(1 + focusBlend * 0.01);
  target.addScaledVector(basis.up, Math.sin(time * 0.42 + seeded(meta.id, 95) * TAU) * (isExpanded ? 3 : 1.2));
  return target;
}

function getTimelineItemProgress(item, layoutItems) {
  return getTimelineGroupMeta(item, layoutItems).progress;
}

function getTimelineMaxFlowForItems(layoutItems) {
  const groups = getTimelineGroups(layoutItems);
  const lastGroup = groups[groups.length - 1];
  return Math.max(260, (lastGroup?.progress ?? TIMELINE_GROUP_START) - TIMELINE_END_APPROACH_OFFSET);
}

function getTimelineGroupKey(item) {
  if (item.year < 900) return '唐代';
  if (item.year < 1000) return '吴越';
  if (item.year < 1127) return '北宋';
  if (item.year < 1368) return '南宋';
  if (item.year < 1644) return '明代';
  if (item.year < 1840) return '清代';
  if (item.year < 1949) return '近代';
  if (item.year < 2000) return '现代';
  return '当代';
}

function getTimelineGroups(layoutItems) {
  const groups = new Map();
  [...layoutItems]
    .sort((a, b) => a.year - b.year || getItemNumber(a) - getItemNumber(b))
    .forEach(item => {
      const id = getTimelineGroupKey(item);
      if (!groups.has(id)) groups.set(id, { id, label: id, startYear: Number(id), items: [] });
      groups.get(id).items.push(item);
    });
  return [...groups.values()]
    .sort((a, b) => a.startYear - b.startYear)
    .map((group, groupIndex) => ({
      ...group,
      groupIndex,
      progress: TIMELINE_GROUP_START + groupIndex * TIMELINE_GROUP_SPACING
    }));
}

function getTimelineGroupMeta(item, layoutItems) {
  const groups = getTimelineGroups(layoutItems);
  const groupId = getTimelineGroupKey(item);
  const groupIndex = Math.max(0, groups.findIndex(group => group.id === groupId));
  const group = groups[groupIndex] || { id: groupId, label: groupId, items: [item] };
  const itemIndex = Math.max(0, group.items.findIndex(entry => entry.id === item.id));
  return {
    ...group,
    groupIndex: group.groupIndex ?? groupIndex,
    groupItems: group.items,
    itemIndex,
    progress: group.progress ?? TIMELINE_GROUP_START + groupIndex * TIMELINE_GROUP_SPACING
  };
}

function getTimelineGroupProgressById(groupId, layoutItems) {
  const groups = getTimelineGroups(layoutItems);
  const groupIndex = Math.max(0, groups.findIndex(group => group.id === groupId));
  return groups[groupIndex]?.progress ?? TIMELINE_GROUP_START + groupIndex * TIMELINE_GROUP_SPACING;
}

function getTimelineDepthFocus(progressAhead, expanded = false) {
  if (expanded) return 1;
  return THREE.MathUtils.clamp(1 - Math.max(0, progressAhead - 460) / 1600, 0.52, 1);
}

function getTimelineLocalDepthScale(depthFocus, expanded = false) {
  return expanded ? 1 : depthFocus;
}

function getTimelineHolderScaleFactor(timelineHolder, visual, depthFocus) {
  return timelineHolder?.scale?.x ?? ((visual?.scale?.x ?? 1) * depthFocus);
}

function getTimelineRenderOrder(distance) {
  return Math.round(20000 - distance);
}

function getTimelineGroupSide(group) {
  return [-156, 136, -124, 166, -172, 112][group.groupIndex % 6] + (seeded(group.id, 77) - 0.5) * 10;
}

function orientTimelineHolder(holder, visual) {
  const front = visual.basis.tangent.clone().multiplyScalar(-1).normalize();
  const up = visual.basis.up.clone().normalize();
  const right = new THREE.Vector3().crossVectors(up, front).normalize();
  const matrix = new THREE.Matrix4().makeBasis(right, up, front);
  holder.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(matrix), 0.22);
}

function orientTimelineCard(card, visual, timelineGroup, item, expanded, timelineHolder = null, snapToHolder = true) {
  const syncWithHolder = Boolean(timelineHolder?.quaternion);
  let targetQuaternion;
  if (syncWithHolder) {
    targetQuaternion = timelineHolder.quaternion.clone();
  } else {
    const front = visual.basis.tangent.clone().multiplyScalar(-1).normalize();
    const up = visual.basis.up.clone().normalize();
    const right = new THREE.Vector3().crossVectors(up, front).normalize();
    const matrix = new THREE.Matrix4().makeBasis(right, up, front);
    targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(matrix);
  }
  const centeredIndex = timelineGroup.itemIndex - (timelineGroup.groupItems.length - 1) / 2;
  const localTilt = expanded ? (seeded(item.id, 120) - 0.5) * 0.08 : (seeded(item.id, 121) - 0.5) * 0.025;
  const localYaw = expanded
    ? centeredIndex * 0.022
    : (visual.side < 0 ? 0.035 : -0.035);
  targetQuaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(expanded ? -4.5 : -2.2),
    localYaw,
    localTilt,
    'XYZ'
  )));
  if (syncWithHolder && snapToHolder) {
    card.quaternion.copy(targetQuaternion);
  } else {
    card.quaternion.slerp(targetQuaternion, 0.22);
  }
}

function getTimelineVisualModel(group, timelineGroupId = null) {
  const basis = getTimelineBasis(group.progress);
  const side = getTimelineGroupSide(group);
  const expanded = timelineGroupId === group.id;
  const hasExpanded = Boolean(timelineGroupId);
  const target = basis.point.clone();

  if (expanded) {
    target
      .addScaledVector(basis.right, 0)
      .addScaledVector(basis.up, 34)
      .addScaledVector(basis.tangent, -102);
  } else {
    target
      .addScaledVector(basis.right, side)
      .addScaledVector(basis.up, 70)
      .addScaledVector(basis.tangent, 0);
  }

  if (hasExpanded && !expanded) {
    target
      .addScaledVector(basis.up, -76)
      .addScaledVector(basis.tangent, 148)
      .addScaledVector(basis.right, side > 0 ? 58 : -58);
  }

  target.addScaledVector(basis.up, -TIMELINE_HOLDER_DROP);

  return {
    basis,
    side,
    expanded,
    target,
    scale: expanded ? new THREE.Vector3(1.18, 1.18, 1.18) : new THREE.Vector3(0.88, 0.88, 0.88),
    opacity: expanded ? 0.86 : hasExpanded ? 0.34 : 0.96
  };
}

function getTimelineAccent(group, expanded = false) {
  const palette = [0x74d36d, 0x8a82dc, 0xef9418, 0xe4c616, 0x5fc9c2, 0xd05048, 0x3d67c8];
  return expanded ? 0x28f4ff : palette[group.groupIndex % palette.length];
}

function getTimelinePathPoint(progress) {
  return new THREE.Vector3(
    0,
    -155,
    230 - progress * 1.02
  );
}

function getTimelineBasis(progress) {
  const point = getTimelinePathPoint(progress);
  const ahead = getTimelinePathPoint(progress + 18);
  const tangent = ahead.sub(point).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
  return { point, tangent, right, up };
}

function getTimelineCameraState(flow, orbit = 0, heightOffset = 0) {
  const basis = getTimelineBasis(flow);
  const lookBasis = getTimelineBasis(flow + 1700);
  const viewSide = THREE.MathUtils.clamp(
    orbit * TIMELINE_VIEW_SIDE_SCALE,
    -TIMELINE_VIEW_SIDE_LIMIT,
    TIMELINE_VIEW_SIDE_LIMIT
  );
  const height = THREE.MathUtils.clamp(92 + heightOffset, 64, 218);

  return {
    position: basis.point
      .clone()
      .addScaledVector(basis.right, viewSide)
      .addScaledVector(basis.up, height)
      .addScaledVector(basis.tangent, -320),
    lookAt: lookBasis.point
      .clone()
      .addScaledVector(lookBasis.right, viewSide * 0.25)
      .addScaledVector(lookBasis.up, -820)
  };
}

function getMapTarget(item, time, focusBlend = 0, relayoutPulse = 0) {
  const pulse = Math.sin(relayoutPulse * Math.PI);
  const location = item.location;
  const z = -98 + (seeded(item.id, 104) - 0.5) * 18;
  const target = new THREE.Vector3(
    location.x + (seeded(item.id, 102) - 0.5) * 18 * pulse,
    location.y + XIANGDONG_MAP_BASE_Y + (seeded(item.id, 103) - 0.5) * 14 * pulse,
    z
  ).multiplyScalar(1 + focusBlend * 0.012);

  target.y += Math.sin(time * 0.26 + seeded(item.id, 105) * TAU) * 2.5;
  return target;
}

function getMapLocationItems(layoutItems, locationId) {
  if (!locationId) return [];
  return [...layoutItems]
    .filter(item => item.location.id === locationId)
    .sort((a, b) => a.year - b.year || getItemNumber(a) - getItemNumber(b));
}

function getMapClusterItemIndex(item, clusterItems) {
  return Math.max(0, clusterItems.findIndex(entry => entry.id === item.id));
}

function getMapCardClusterTarget(item, clusterItems, pan, zoom, time, relayoutPulse = 0) {
  const index = getMapClusterItemIndex(item, clusterItems);
  const center = (clusterItems.length - 1) / 2;
  const offsetIndex = index - center;
  const anchor = transformMapPosition(
    new THREE.Vector3(item.location.x, item.location.y + XIANGDONG_MAP_BASE_Y, -72),
    pan,
    zoom
  );
  const horizontalSide = anchor.x > 240 ? -1 : 1;
  const verticalSide = anchor.y > 170 ? -1 : 1;
  const pulse = Math.sin(relayoutPulse * Math.PI);
  const fanGap = clusterItems.length > 5 ? 42 : 50;
  const fanLift = Math.max(0, 1 - Math.abs(offsetIndex) / Math.max(1, center + 1));

  return new THREE.Vector3(
    anchor.x + horizontalSide * 130 + offsetIndex * fanGap + (seeded(item.id, 132) - 0.5) * 18 * pulse,
    anchor.y + verticalSide * (96 + fanLift * 18) - Math.abs(offsetIndex) * 4 + Math.sin(time * 0.8 + index) * 1.8,
    54 + fanLift * 28 + Math.abs(offsetIndex) * 3
  );
}

function getMapStopById(locationId) {
  return xiangdongRouteStops.find(stop => stop.id === locationId) || null;
}

function createMapSelectionPulse() {
  const group = new THREE.Group();
  group.name = 'xiangdong-selected-location-pulse';
  group.visible = false;
  group.raycast = () => {};

  const halo = new THREE.Mesh(
    new THREE.CircleGeometry(48, 54),
    new THREE.MeshBasicMaterial({
      color: 0xf0b75c,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  halo.name = 'xiangdong-selection-halo';
  halo.renderOrder = 36;
  halo.material.userData.baseOpacity = 0.16;
  group.add(halo);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(20, 31, 56),
    new THREE.MeshBasicMaterial({
      color: 0xffd891,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  ring.name = 'xiangdong-selection-ring';
  ring.position.z = 1.2;
  ring.renderOrder = 38;
  ring.material.userData.baseOpacity = 0.78;
  group.add(ring);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(6, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  core.name = 'xiangdong-selection-core';
  core.position.z = 2.4;
  core.renderOrder = 39;
  core.material.userData.baseOpacity = 0.92;
  group.add(core);

  group.userData.halo = halo;
  group.userData.ring = ring;
  group.userData.core = core;
  return group;
}

function updateMapSelectionPulse(group, locationId, time) {
  const stop = getMapStopById(locationId);
  if (!stop) {
    group.visible = false;
    return;
  }

  const wave = 0.5 + 0.5 * Math.sin(time * 3.2);
  group.visible = true;
  group.position.set(stop.x, stop.y, -79 + getXiangdongTerrainHeight(stop.x, stop.y) * 0.18);
  group.scale.setScalar(1.04 + wave * 0.18);
  group.userData.halo.material.opacity = group.userData.halo.material.userData.baseOpacity * (0.72 + wave * 0.46);
  group.userData.ring.material.opacity = group.userData.ring.material.userData.baseOpacity * (0.74 + wave * 0.32);
  group.userData.core.material.opacity = group.userData.core.material.userData.baseOpacity * (0.82 + wave * 0.18);
}

function createMapClusterConnector() {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]),
    new THREE.LineBasicMaterial({
      color: 0xffd891,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  line.name = 'xiangdong-map-card-connector';
  line.visible = false;
  line.renderOrder = 31000;
  line.raycast = () => {};
  return line;
}

function updateMapClusterConnector(connector, locationId, clusterItems, pan, zoom, time) {
  const stop = getMapStopById(locationId);
  if (!stop || !clusterItems.length) {
    connector.visible = false;
    connector.material.opacity = 0;
    return;
  }

  const centerItem = clusterItems[Math.floor(clusterItems.length / 2)];
  const anchor = transformMapPosition(
    new THREE.Vector3(stop.x, stop.y + XIANGDONG_MAP_BASE_Y, -20),
    pan,
    zoom
  );
  const cardTarget = getMapCardClusterTarget(centerItem, clusterItems, pan, zoom, time);
  const directionX = cardTarget.x >= anchor.x ? 1 : -1;
  const directionY = cardTarget.y >= anchor.y ? 1 : -1;
  const end = new THREE.Vector3(cardTarget.x - directionX * 64, cardTarget.y - directionY * 32, 42);
  const elbow = new THREE.Vector3(
    anchor.x + (end.x - anchor.x) * 0.48,
    anchor.y + (end.y - anchor.y) * 0.5 + directionY * 18,
    28
  );

  connector.geometry.setFromPoints([
    new THREE.Vector3(anchor.x, anchor.y, 20),
    elbow,
    end
  ]);
  connector.geometry.computeBoundingSphere();
  connector.visible = true;
  connector.material.opacity = 0.32 + Math.sin(time * 3.4) * 0.06;
  connector.material.needsUpdate = true;
}

function updateMapFeatureSelection(mapGuide, locationId, time) {
  const hasSelection = Boolean(locationId);
  mapGuide.traverse(object => {
    if (!object.userData?.mapLocationId || !object.userData.mapBaseScale) return;
    const selected = object.userData.mapLocationId === locationId;
    const baseScale = object.userData.mapBaseScale;
    const pulse = selected ? 1.03 + Math.sin(time * 3.2) * 0.025 : 1;
    const dim = hasSelection && !selected ? 0.88 : 1;
    object.scale.set(baseScale.x * pulse * dim, baseScale.y * pulse * dim, baseScale.z);
    object.renderOrder = (object.userData.mapBaseRenderOrder ?? object.renderOrder ?? 0) + (selected ? 18 : 0);
    object.traverse(child => {
      if (!child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(material => {
        const factor = selected ? 1.24 : hasSelection ? 0.68 : 1;
        material.opacity = THREE.MathUtils.clamp(material.opacity * factor, 0, 1);
        material.needsUpdate = true;
      });
    });
  });
}

function transformMapPosition(position, pan, zoom) {
  return new THREE.Vector3(
    position.x * zoom + pan.x,
    (position.y - XIANGDONG_MAP_BASE_Y) * zoom + XIANGDONG_MAP_BASE_Y + pan.y,
    position.z
  );
}

function clampMapPan(pan, zoom) {
  const maxX = Math.max(0, (XIANGDONG_MAP_SIZE.width * zoom - XIANGDONG_MAP_VIEW_SIZE.width) * 0.5 - XIANGDONG_MAP_PAN_MARGIN);
  const maxY = Math.max(0, (XIANGDONG_MAP_SIZE.height * zoom - XIANGDONG_MAP_VIEW_SIZE.height) * 0.5 - XIANGDONG_MAP_PAN_MARGIN);
  pan.x = THREE.MathUtils.clamp(pan.x, -maxX, maxX);
  pan.y = THREE.MathUtils.clamp(pan.y, -maxY, maxY);
  return pan;
}

function getMapRepresentativeIds(layoutItems) {
  const chosen = new Map();
  [...layoutItems]
    .sort((a, b) => a.year - b.year || getItemNumber(a) - getItemNumber(b))
    .forEach(item => {
      if (!chosen.has(item.location.id)) chosen.set(item.location.id, item.id);
    });
  return new Set(chosen.values());
}

function getMapHitLocationId(hit) {
  let current = hit;
  while (current) {
    if (current.userData?.mapLocationId) return current.userData.mapLocationId;
    current = current.parent;
  }
  return null;
}

function getMapItemForLocation(layoutItems, locationId) {
  return getMapLocationItems(layoutItems, locationId)[0] || null;
}

function getControlledSlotIndex(index, count, layoutKey) {
  if (layoutKey.endsWith('-base') || count < 4) return index;
  const groupSize = getShuffleGroupSize(count);
  const group = Math.floor(index / groupSize);
  const groupStart = group * groupSize;
  const groupLength = Math.min(groupSize, count - groupStart);
  if (groupLength < 2) return index;

  const local = index - groupStart;
  const direction = seeded(`${layoutKey}-group-${group}`, 31) > 0.5 ? 1 : -1;
  const maxShift = Math.min(2, groupLength - 1);
  const shift = 1 + Math.floor(seeded(`${layoutKey}-group-${group}`, 32) * maxShift);
  return groupStart + (local + direction * shift + groupLength) % groupLength;
}

function getShuffleGroupSize(count) {
  const sizes = count > 24 ? [5, 6, 4, 7] : [4, 5, 3, 6];
  return sizes.find(size => count <= size || count % size !== 1) || sizes[0];
}

function getSphereSlot(index, count) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const offset = seeded('overview-sphere', 52) * TAU;
  const y = 1 - ((index + 0.5) / count) * 2;
  const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = index * golden + offset;
  const radius = SPHERE_RADIUS * (0.94 + seeded(`overview-${index}`, 61) * 0.18);
  return new THREE.Vector3(
    Math.cos(theta) * ringRadius * radius,
    y * radius * 0.86,
    Math.sin(theta) * ringRadius * radius
  );
}

function getItemNumber(item) {
  return Number(item.id.replace('obj-', '')) || 0;
}

function drawTextureArt(ctx, item, x, y, w, h) {
  const palettes = {
    image: ['#e5e0ca', '#63846f', '#0b1714'],
    document: ['#e8d6ad', '#8a7650', '#1a1510'],
    video: ['#dff3f1', '#4b7784', '#0d1820'],
    object: ['#dbc6a8', '#7a5d43', '#15110e'],
    audio: ['#d6cbef', '#63577f', '#151225'],
    map: ['#e3cd96', '#71815d', '#121b12']
  };
  const p = palettes[item.type];
  const base = ctx.createLinearGradient(x, y, x + w, y + h);
  base.addColorStop(0, p[0]);
  base.addColorStop(0.58, p[1]);
  base.addColorStop(1, p[2]);
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  const horizon = y + h * 0.58;
  const mist = ctx.createLinearGradient(x, y + h * 0.28, x, h + y);
  mist.addColorStop(0, 'rgba(255,255,255,.18)');
  mist.addColorStop(0.46, 'rgba(255,255,255,.04)');
  mist.addColorStop(1, 'rgba(0,0,0,.26)');
  ctx.fillStyle = mist;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = 'rgba(12, 24, 20, .18)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.28, y + h * 0.74, w * 0.38, h * 0.12, -0.08, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 242, 190, .14)';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.72, y + h * 0.28, w * 0.18, h * 0.14, 0.16, 0, TAU);
  ctx.fill();

  if (item.type === 'image' || item.type === 'map') {
    ctx.fillStyle = 'rgba(16, 44, 38, .28)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.52, horizon + h * 0.03, w * 0.48, h * 0.16, 0.02, 0, TAU);
    ctx.fill();
  }

  if (item.type === 'object') {
    ctx.fillStyle = 'rgba(255, 235, 182, .22)';
    round(ctx, x + w * 0.47, y + h * 0.2, w * 0.1, h * 0.48, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 235, 182, .14)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.52, y + h * 0.22, w * 0.13, h * 0.05, 0, 0, TAU);
    ctx.fill();
  }

  if (item.type === 'video') {
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    round(ctx, x + w / 2 - 68, y + h / 2 - 68, 136, 136, 68);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 14, y + h / 2 - 36);
    ctx.lineTo(x + w / 2 - 14, y + h / 2 + 36);
    ctx.lineTo(x + w / 2 + 42, y + h / 2);
    ctx.closePath();
    ctx.fill();
  }

  if (item.type === 'audio') {
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.46, w * 0.34, h * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.46, w * 0.16, h * 0.1, 0, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.fillRect(x, y + h - 96, w, 96);
}

function createParticleField() {
  const count = 0;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const radius = 120 + seeded(`star-${i}`, 1) * 820;
    const angle = seeded(`star-${i}`, 2) * TAU;
    const height = -330 + seeded(`star-${i}`, 3) * 660;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    color.set(seeded(`star-${i}`, 4) > 0.84 ? '#f0b75c' : '#8cf7ff');
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 2.0, transparent: true, opacity: 0, vertexColors: true, depthWrite: false })
  );
}

function createSphereGuide() {
  return new THREE.Group();
}

function createTimelineGuide() {
  const group = new THREE.Group();
  const trackLength = TIMELINE_GUIDE_LENGTH * 1.02;
  const trackWidth = 980;

  const base = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth + 120, trackLength, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x06131b,
      transparent: true,
      opacity: 0.74,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -250, TIMELINE_TRACK_START_Z - trackLength / 2);
  base.renderOrder = -12;
  group.add(base);

  const track = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth, trackLength, 1, 1),
    new THREE.MeshBasicMaterial({
      map: makeTimelineTrackTexture(),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  track.rotation.x = -Math.PI / 2;
  track.position.set(0, -244, TIMELINE_TRACK_START_Z - trackLength / 2);
  track.renderOrder = -10;
  group.add(track);

  const platformGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(trackWidth + 260, trackLength, 1, 1),
    new THREE.MeshBasicMaterial({
      map: makeTimelinePlatformGlowTexture(),
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  platformGlow.rotation.x = -Math.PI / 2;
  platformGlow.position.set(0, -242.5, TIMELINE_TRACK_START_Z - trackLength / 2);
  platformGlow.renderOrder = -9;
  group.add(platformGlow);

  const platformRim = createTimelinePlatformRim(trackWidth, trackLength);
  platformRim.position.z = TIMELINE_TRACK_START_Z - trackLength / 2;
  group.add(platformRim);

  const airStarCount = 0;
  const airStarPositions = new Float32Array(airStarCount * 3);
  const airStarColors = new Float32Array(airStarCount * 3);
  const airStarGeometry = new THREE.BufferGeometry();
  airStarGeometry.setAttribute('position', new THREE.BufferAttribute(airStarPositions, 3));
  airStarGeometry.setAttribute('color', new THREE.BufferAttribute(airStarColors, 3));
  const airStars = new THREE.Points(
    airStarGeometry,
    new THREE.PointsMaterial({
      size: 1.85,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      vertexColors: true,
      map: makeTimelineSparkleTexture(),
      alphaTest: 0.015,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false
    })
  );
  airStars.name = 'timeline-air-stars';
  airStars.renderOrder = -8;
  airStars.frustumCulled = false;
  airStars.userData.baseOpacity = airStars.material.opacity;
  group.userData.airStars = airStars;
  group.add(airStars);

  group.visible = false;
  return group;
}

function updateTimelineAirStars(guide, flow, camera, cameraLookAt) {
  const airStars = guide.userData.airStars;
  if (!airStars?.geometry) return;
  const positions = airStars.geometry.getAttribute('position');
  const colors = airStars.geometry.getAttribute('color');
  const count = positions.count;
  const forward = cameraLookAt.clone().sub(camera.position).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
  right.normalize();
  const viewUp = new THREE.Vector3().crossVectors(right, forward).normalize();
  const fovScale = Math.tan(THREE.MathUtils.degToRad(camera.fov || 66) * 0.5);
  const aspect = camera.aspect || 16 / 9;
  const screenDrift = flow * 0.00012;
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const seedKey = `timeline-screen-star-${i}`;
    const layer = seeded(`timeline-air-layer-${seedKey}`, 1);
    const depth = 540 + layer * 2520;
    const halfHeight = depth * fovScale;
    const halfWidth = halfHeight * aspect;
    const horizontal = (seeded(`timeline-air-screen-x-${seedKey}`, 2) - 0.5) * 2.34;
    const vertical = (seeded(`timeline-air-screen-y-${seedKey}`, 3) - 0.5) * 2.22;
    const shimmerPhase = seeded(`timeline-air-phase-${seedKey}`, 4) * TAU;
    const driftX = Math.sin(screenDrift * (0.7 + layer * 0.8) + shimmerPhase) * 0.035;
    const driftY = Math.cos(screenDrift * (0.55 + layer * 0.65) + shimmerPhase) * 0.026;
    const point = camera.position
      .clone()
      .addScaledVector(forward, depth)
      .addScaledVector(right, (horizontal + driftX) * halfWidth)
      .addScaledVector(viewUp, (vertical + driftY) * halfHeight);
    positions.setXYZ(i, point.x, point.y, point.z);

    const coolMix = seeded(`timeline-air-cool-${seedKey}`, 5);
    color.set(coolMix > 0.82 ? '#f5feff' : '#a9f0ff');
    const centralDeckMask = vertical < 0.32 && Math.abs(horizontal) < 0.82 ? 0 : 1;
    const lowerScreenSoftness = vertical < -0.82 ? 0.38 : 1;
    const depthFade = THREE.MathUtils.lerp(1.16, 0.54, layer);
    const brightness = (0.56 + seeded(`timeline-air-bright-${seedKey}`, 6) * 0.42) * depthFade * lowerScreenSoftness * centralDeckMask;
    colors.setXYZ(i, color.r * brightness, color.g * brightness, color.b * brightness);
  }

  positions.needsUpdate = true;
  colors.needsUpdate = true;
}

function createTimelinePlatformRim(trackWidth, trackLength) {
  const group = new THREE.Group();
  const edgeTexture = makeTimelineRimGlowTexture();
  const edgeMaterial = new THREE.MeshBasicMaterial({
    map: edgeTexture,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false
  });
  edgeMaterial.userData.baseOpacity = edgeMaterial.opacity;

  [-1, 1].forEach(side => {
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(trackLength, 82, 1, 1), edgeMaterial.clone());
    rim.name = side < 0 ? 'timeline-platform-rim-left' : 'timeline-platform-rim-right';
    rim.rotation.y = Math.PI / 2;
    rim.position.set(side * (trackWidth / 2 + 12), -214, 0);
    rim.renderOrder = -7;
    group.add(rim);

    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(18, 7, trackLength),
      new THREE.MeshBasicMaterial({
        color: 0x58eaff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      })
    );
    rail.name = side < 0 ? 'timeline-platform-rail-left' : 'timeline-platform-rail-right';
    rail.position.set(side * (trackWidth / 2 + 4), -237, 0);
    rail.renderOrder = -6;
    group.add(rail);
  });

  return group;
}

function makeTimelineSparkleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 15);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.28, 'rgba(230,252,255,.9)');
  glow.addColorStop(0.56, 'rgba(190,245,255,.28)');
  glow.addColorStop(1, 'rgba(190,245,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 32, 32);
  ctx.strokeStyle = 'rgba(245,255,255,.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, 8);
  ctx.lineTo(16, 24);
  ctx.moveTo(8, 16);
  ctx.lineTo(24, 16);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeTimelineRimGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const verticalGlow = ctx.createLinearGradient(0, 0, 0, canvas.height);
  verticalGlow.addColorStop(0, 'rgba(148,248,255,0)');
  verticalGlow.addColorStop(0.32, 'rgba(120,242,255,.48)');
  verticalGlow.addColorStop(0.56, 'rgba(82,228,255,.22)');
  verticalGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = verticalGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const runGlow = ctx.createLinearGradient(0, 0, canvas.width, 0);
  runGlow.addColorStop(0, 'rgba(0,0,0,0)');
  runGlow.addColorStop(0.16, 'rgba(100,236,255,.18)');
  runGlow.addColorStop(0.5, 'rgba(220,255,255,.36)');
  runGlow.addColorStop(0.84, 'rgba(100,236,255,.18)');
  runGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = runGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function makeTimelinePlatformGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 3072;
  const ctx = canvas.getContext('2d');
  const left = 76;
  const right = canvas.width - 76;
  const width = right - left;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const edgeWash = ctx.createLinearGradient(0, 0, canvas.width, 0);
  edgeWash.addColorStop(0, 'rgba(0,0,0,0)');
  edgeWash.addColorStop(0.08, 'rgba(65,230,255,.1)');
  edgeWash.addColorStop(0.18, 'rgba(96,238,255,.22)');
  edgeWash.addColorStop(0.5, 'rgba(166,248,255,.08)');
  edgeWash.addColorStop(0.82, 'rgba(96,238,255,.2)');
  edgeWash.addColorStop(0.92, 'rgba(65,230,255,.1)');
  edgeWash.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = edgeWash;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerPulse = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.54,
    canvas.width * 0.06,
    canvas.width * 0.5,
    canvas.height * 0.5,
    canvas.width * 0.58
  );
  centerPulse.addColorStop(0, 'rgba(224,255,255,.16)');
  centerPulse.addColorStop(0.44, 'rgba(92,236,255,.08)');
  centerPulse.addColorStop(1, 'rgba(92,236,255,0)');
  ctx.fillStyle = centerPulse;
  ctx.fillRect(left, 0, width, canvas.height);

  const drawRail = (x, railWidth, alpha) => {
    const rail = ctx.createLinearGradient(x, 0, x + railWidth, 0);
    rail.addColorStop(0, 'rgba(94,238,255,0)');
    rail.addColorStop(0.5, `rgba(136,248,255,${alpha})`);
    rail.addColorStop(1, 'rgba(94,238,255,0)');
    ctx.fillStyle = rail;
    ctx.fillRect(x, 0, railWidth, canvas.height);
  };

  drawRail(left + 22, 34, 0.54);
  drawRail(right - 56, 34, 0.5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 10;
  return texture;
}

function makeTimelineTrackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 3072;
  const ctx = canvas.getContext('2d');
  const margin = 70;
  const trackLeft = margin;
  const trackRight = canvas.width - margin;
  const trackTop = 22;
  const trackBottom = canvas.height - 44;
  const trackWidth = trackRight - trackLeft;

  ctx.save();
  round(ctx, 18, 20, canvas.width - 36, canvas.height - 40, 42);
  ctx.clip();

  const bed = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bed.addColorStop(0, 'rgba(13, 29, 38, .98)');
  bed.addColorStop(0.48, 'rgba(25, 50, 60, .97)');
  bed.addColorStop(1, 'rgba(15, 31, 40, .98)');
  ctx.fillStyle = bed;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerWash = ctx.createLinearGradient(trackLeft, 0, trackRight, 0);
  centerWash.addColorStop(0, 'rgba(0,0,0,.12)');
  centerWash.addColorStop(0.2, 'rgba(117,238,255,.06)');
  centerWash.addColorStop(0.5, 'rgba(214,250,255,.13)');
  centerWash.addColorStop(0.8, 'rgba(117,238,255,.06)');
  centerWash.addColorStop(1, 'rgba(0,0,0,.12)');
  ctx.fillStyle = centerWash;
  ctx.fillRect(trackLeft, trackTop, trackWidth, trackBottom - trackTop);

  const sideShade = ctx.createLinearGradient(trackLeft, 0, trackRight, 0);
  sideShade.addColorStop(0, 'rgba(0,0,0,.24)');
  sideShade.addColorStop(0.16, 'rgba(0,0,0,.02)');
  sideShade.addColorStop(0.84, 'rgba(0,0,0,.02)');
  sideShade.addColorStop(1, 'rgba(0,0,0,.24)');
  ctx.fillStyle = sideShade;
  ctx.fillRect(trackLeft, trackTop, trackWidth, trackBottom - trackTop);

  const drawVerticalGlow = (x, width, alpha) => {
    const glow = ctx.createLinearGradient(x, 0, x + width, 0);
    glow.addColorStop(0, `rgba(114,235,255,0)`);
    glow.addColorStop(0.5, `rgba(114,235,255,${alpha})`);
    glow.addColorStop(1, `rgba(114,235,255,0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x, trackTop, width, trackBottom - trackTop);
  };

  drawVerticalGlow(trackLeft + 22, 72, 0.24);
  drawVerticalGlow(trackRight - 94, 72, 0.22);

  ctx.strokeStyle = 'rgba(218,248,252,.13)';
  ctx.lineWidth = 2;
  [trackLeft + trackWidth * 0.34, trackRight - trackWidth * 0.34].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, trackTop + 22);
    ctx.lineTo(x, trackBottom - 22);
    ctx.stroke();
  });

  const glass = ctx.createRadialGradient(
    canvas.width * 0.52,
    canvas.height * 0.58,
    canvas.width * 0.08,
    canvas.width * 0.52,
    canvas.height * 0.55,
    canvas.width * 0.82
  );
  glass.addColorStop(0, 'rgba(255,255,255,.16)');
  glass.addColorStop(0.5, 'rgba(255,255,255,.04)');
  glass.addColorStop(1, 'rgba(0,0,0,.2)');
  ctx.fillStyle = glass;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const timelineMarks = ['唐', '吴越', '北宋', '南宋', '明', '清', '近代', '现代', '当代'];
  timelineMarks.forEach((year, i) => {
    const progress = TIMELINE_GROUP_START + i * TIMELINE_GROUP_SPACING + TIMELINE_TRACK_LEAD;
    const y = canvas.height - (progress / TIMELINE_GUIDE_LENGTH) * canvas.height;
    const major = i % 2 === 0;
    const fontSize = i < 3 ? 54 : 42;
    ctx.font = `800 ${fontSize}px "Segoe UI", Arial, sans-serif`;
    ctx.fillStyle = major ? 'rgba(246,252,255,.38)' : 'rgba(238,248,252,.24)';
    ctx.shadowColor = 'rgba(68,220,255,.14)';
    ctx.shadowBlur = 10;
    ctx.fillText(year, canvas.width / 2, y);
  });

  ctx.shadowBlur = 0;
  const fade = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fade.addColorStop(0, 'rgba(0,0,0,.14)');
  fade.addColorStop(0.26, 'rgba(0,0,0,0)');
  fade.addColorStop(0.78, 'rgba(0,0,0,.05)');
  fade.addColorStop(1, 'rgba(0,0,0,.12)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 12;
  return texture;
}

function createMapGuide() {
  const group = new THREE.Group();
  group.position.y = XIANGDONG_MAP_BASE_Y;
  const mapWidth = XIANGDONG_MAP_SIZE.width;
  const mapHeight = XIANGDONG_MAP_SIZE.height;
  const underlay = new THREE.Mesh(
    new THREE.PlaneGeometry(mapWidth * 3.2, mapHeight * 3.2, 1, 1),
    new THREE.MeshBasicMaterial({
      map: makeXiangdongMapUnderlayTexture(),
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  underlay.name = 'xiangdong-terrain-underlay';
  underlay.position.z = -214;
  underlay.renderOrder = -30;
  group.add(underlay);

  const terrainTexture = createWestLakeMapTexture();
  const terrain = new THREE.Mesh(
    createXiangdongTerrainGeometry(mapWidth, mapHeight),
    new THREE.MeshBasicMaterial({
      map: terrainTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  terrain.name = 'xiangdong-terrain-board';
  terrain.renderOrder = -5;
  group.add(terrain);

  const edge = new THREE.Mesh(
    new THREE.PlaneGeometry(mapWidth + 16, mapHeight + 16, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x10241f,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  edge.position.z = -166;
  edge.renderOrder = -8;
  group.add(edge);

  xiangdongRouteStops.forEach((stop, index) => {
    const marker = createXiangdongMapMarker(index === 0 ? 0xbdf7d1 : stop.id === 'leifeng' ? 0xf0b75c : 0x76fff1);
    marker.position.set(stop.x, stop.y, -91 + getXiangdongTerrainHeight(stop.x, stop.y) * 0.18);
    markMapLocationTarget(marker, stop);
    group.add(marker);

    const sprite = createMapFeatureLabelSprite(stop.label, stop.meta);
    const labelSide = index % 2 === 0 ? 1 : -1;
    const labelYOffset = stop.id === 'dongshan' ? -58 : 42 * labelSide;
    const labelXOffset = stop.id === 'mapu' ? 42 : stop.id === 'chendai' ? -48 : 0;
    sprite.position.set(stop.x + labelXOffset, stop.y + labelYOffset, -86);
    sprite.scale.set(114, 44, 1);
    markMapLocationTarget(sprite, stop);
    group.add(sprite);
  });

  const title = createMapFeatureLabelSprite('杭州西湖', '真实地形图漫游');
  title.position.set(-240, -360, -88);
  title.scale.set(150, 50, 1);
  group.add(title);

  group.visible = false;
  return group;
}

function createXiangdongTerrainGeometry(width, height) {
  const geometry = new THREE.PlaneGeometry(width, height, 96, 64);
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    positions.setZ(i, -158 + getXiangdongTerrainHeight(x, y));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createWestLakeMapTexture() {
  const source = westLakeAssetsById['west-lake-area-map'] || westLakeAssetsById['terrain-west-lake'];
  const texture = new THREE.TextureLoader().load(source?.src || '/assets/westlake/full-west-lake-area-map.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 12;
  return texture;
}

function getXiangdongTerrainHeight(x, y) {
  const hill = (cx, cy, sx, sy, amp) => {
    const dx = (x - cx) / sx;
    const dy = (y - cy) / sy;
    return Math.exp(-(dx * dx + dy * dy)) * amp;
  };
  const westernHills =
    hill(-565, 110, 180, 260, 36) +
    hill(-410, -190, 220, 180, 30) +
    hill(-225, 245, 240, 150, 18);
  const southernHills =
    hill(35, -430, 360, 120, 24) +
    hill(325, -388, 260, 130, 18);
  const islandRise =
    hill(95, -88, 88, 60, 12) +
    hill(310, 24, 74, 54, 9);
  const lakeDip = hill(52, 18, 540, 330, 18);
  return THREE.MathUtils.clamp(10 + westernHills + southernHills + islandRise - lakeDip, 2, 54);
}

function makeXiangdongTerrainTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 2400;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const toCanvasX = x => ((x + width / 2) / width) * canvas.width;
  const toCanvasY = y => ((height / 2 - y) / height) * canvas.height;

  const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, '#203329');
  base.addColorStop(0.42, '#183329');
  base.addColorStop(0.72, '#18303b');
  base.addColorStop(1, '#07131b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lake = ctx.createRadialGradient(
    toCanvasX(82),
    toCanvasY(18),
    120,
    toCanvasX(82),
    toCanvasY(18),
    720
  );
  lake.addColorStop(0, 'rgba(71, 178, 176, .88)');
  lake.addColorStop(0.54, 'rgba(31, 104, 116, .78)');
  lake.addColorStop(1, 'rgba(10, 44, 64, .62)');
  ctx.fillStyle = lake;
  ctx.beginPath();
  ctx.ellipse(toCanvasX(80), toCanvasY(18), 690, 470, -0.08, 0, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(219, 226, 180, .18)';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = 'rgba(38, 76, 47, .64)';
  drawMapBlob(ctx, toCanvasX(-478), toCanvasY(86), 420, 620, -0.12);
  ctx.fillStyle = 'rgba(64, 96, 60, .5)';
  drawMapBlob(ctx, toCanvasX(-214), toCanvasY(232), 520, 220, -0.2);
  ctx.fillStyle = 'rgba(86, 102, 61, .38)';
  drawMapBlob(ctx, toCanvasX(158), toCanvasY(-368), 700, 168, 0.04);
  ctx.fillStyle = 'rgba(196, 187, 111, .44)';
  drawMapBlob(ctx, toCanvasX(96), toCanvasY(-88), 176, 96, -0.18);
  drawMapBlob(ctx, toCanvasX(312), toCanvasY(24), 118, 78, 0.22);

  drawTerrainContourRings(ctx, toCanvasX, toCanvasY, -502, 80, 520, 720, -0.1, 9, 'rgba(231,221,166,.1)');
  drawTerrainContourRings(ctx, toCanvasX, toCanvasY, -210, 250, 520, 250, -0.2, 6, 'rgba(181,223,182,.075)');
  drawTerrainContourRings(ctx, toCanvasX, toCanvasY, 120, -378, 760, 190, 0.02, 6, 'rgba(231,221,166,.07)');

  const drawCauseway = (points, widthValue, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = widthValue;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = toCanvasX(point[0]);
      const y = toCanvasY(point[1]);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawCauseway([[-48, 310], [-135, 206], [-198, 92], [-230, -42], [-240, -214]], 15, 'rgba(224, 211, 142, .36)');
  drawCauseway([[235, 338], [102, 308], [-14, 276], [-118, 238]], 13, 'rgba(224, 211, 142, .34)');

  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(3,8,10,.08)';
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 10;
  return texture;
}

function makeXiangdongMapUnderlayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext('2d');

  const base = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, '#173126');
  base.addColorStop(0.45, '#102b27');
  base.addColorStop(0.72, '#0c2630');
  base.addColorStop(1, '#08131b');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lakeGlow = ctx.createRadialGradient(
    canvas.width * 0.54,
    canvas.height * 0.5,
    canvas.width * 0.08,
    canvas.width * 0.54,
    canvas.height * 0.5,
    canvas.width * 0.5
  );
  lakeGlow.addColorStop(0, 'rgba(80, 190, 182, .4)');
  lakeGlow.addColorStop(0.48, 'rgba(35, 110, 120, .3)');
  lakeGlow.addColorStop(1, 'rgba(8,40,60,0)');
  ctx.fillStyle = lakeGlow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let band = 0; band < 16; band += 1) {
    const y = 190 + band * 64;
    ctx.beginPath();
    ctx.moveTo(260, y);
    for (let x = -80; x <= canvas.width + 120; x += 180) {
      const wave = Math.sin((x * 0.006) + band * 0.72) * 30;
      const lift = Math.cos((x * 0.004) + band * 0.48) * 18;
      ctx.quadraticCurveTo(x + 90, y + wave, x + 180, y + lift);
    }
    ctx.strokeStyle = band % 3 === 0 ? 'rgba(232,226,176,.075)' : 'rgba(154,211,184,.052)';
    ctx.lineWidth = band % 3 === 0 ? 2.4 : 1.5;
    ctx.stroke();
  }

  for (let i = 0; i < 8; i += 1) {
    const x = canvas.width * (0.12 + i * 0.075);
    const y = canvas.height * (0.18 + (i % 5) * 0.12);
    ctx.fillStyle = i % 2 ? 'rgba(49,84,56,.16)' : 'rgba(78,95,58,.18)';
    drawMapBlob(ctx, x, y, 360 - i * 14, 220 + i * 10, -0.28 + i * 0.05);
  }

  ctx.strokeStyle = 'rgba(222,216,166,.055)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 11; i += 1) {
    ctx.save();
    ctx.translate(canvas.width * (0.16 + i * 0.068), canvas.height * (0.26 + (i % 5) * 0.105));
    ctx.rotate(-0.28 + i * 0.035);
    ctx.beginPath();
    ctx.ellipse(0, 0, 230 - i * 8, 92 + i * 3, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function drawMapBlob(ctx, x, y, w, h, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawTerrainContourRings(ctx, toCanvasX, toCanvasY, cx, cy, width, height, rotation, count, strokeStyle) {
  ctx.save();
  ctx.translate(toCanvasX(cx), toCanvasY(cy));
  ctx.rotate(rotation);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 2;
  for (let i = 0; i < count; i += 1) {
    const shrink = i / count;
    ctx.beginPath();
    ctx.ellipse(
      0,
      Math.sin(i * 0.9) * 2,
      (width * (1 - shrink * 0.72)) / 2,
      (height * (1 - shrink * 0.74)) / 2,
      0,
      0,
      TAU
    );
    ctx.stroke();
  }
  ctx.restore();
}

function markMapLocationTarget(object, stop) {
  object.userData.mapLocationId = stop.id;
  object.userData.mapLocationLabel = stop.label;
  object.userData.mapBaseScale = object.scale.clone();
  object.userData.mapBaseRenderOrder = object.renderOrder ?? 0;
  object.traverse?.(child => {
    if (child === object) return;
    child.userData.mapLocationId = stop.id;
    child.userData.mapLocationLabel = stop.label;
  });
  return object;
}

function createXiangdongMapMarker(color) {
  const group = new THREE.Group();
  const hitArea = new THREE.Mesh(
    new THREE.CircleGeometry(52, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.001,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      fog: false
    })
  );
  hitArea.name = 'map-marker-hit-area';
  hitArea.position.z = 2.2;
  hitArea.renderOrder = 60;
  group.add(hitArea);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(9, 15, 40),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  ring.renderOrder = 12;
  group.add(ring);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 28),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    })
  );
  core.position.z = 0.4;
  core.renderOrder = 13;
  group.add(core);
  return group;
}

function createMapFeatureLabelSprite(label, meta) {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  round(ctx, 18, 18, 324, 92, 18);
  ctx.fillStyle = 'rgba(5, 13, 15, .76)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(154, 240, 218, .24)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(245,253,246,.92)';
  ctx.font = '700 32px "Microsoft YaHei", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 180, 51);
  ctx.fillStyle = 'rgba(175,226,207,.72)';
  ctx.font = '22px "Microsoft YaHei", Arial, sans-serif';
  ctx.fillText(meta, 180, 82);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    fog: false
  }));
  sprite.renderOrder = 30;
  return sprite;
}

function createLabelSprite(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 76;
  const ctx = canvas.getContext('2d');
  round(ctx, 8, 8, 240, 60, 18);
  ctx.fillStyle = 'rgba(5, 10, 17, .72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(245,251,255,.86)';
  ctx.font = '28px "Microsoft YaHei", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 39);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false }));
  sprite.renderOrder = 20;
  return sprite;
}

function createTimelineYearSprite(label, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.font = '700 44px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 50);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(68, 74, 120, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false }));
  sprite.renderOrder = 30;
  return sprite;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const chars = [...text];
  let line = '';
  let lines = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const testLine = line + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = chars[i];
      if (lines >= maxLines - 1) {
        const rest = chars.slice(i).join('');
        let tail = line + rest;
        while (ctx.measureText(`${tail}...`).width > maxWidth && tail.length > 1) {
          tail = tail.slice(0, -1);
        }
        ctx.fillText(`${tail}...`, x, y + lines * lineHeight);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + lines * lineHeight);
}

function round(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function rgba(hex, alpha) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`;
}

function seeded(text, offset = 0) {
  let hash = 2166136261 + offset;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

createRoot(document.getElementById('root')).render(<App />);
