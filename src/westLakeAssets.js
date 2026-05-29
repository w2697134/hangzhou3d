const assetBasePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const fromAssetBase = path => `${assetBasePath}${path}`;

export const westLakeAssets = [
  {
    id: 'duanqiao',
    title: '断桥残雪',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/duanqiao-broken-bridge.jpg'),
    note: '白堤东端与断桥景观'
  },
  {
    id: 'baidi',
    title: '白堤',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/baidi-causeway.jpg'),
    note: '西湖北岸白堤步行线'
  },
  {
    id: 'pinghu',
    title: '平湖秋月',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/pinghu-autumn-moon.jpg'),
    note: '平湖秋月观景区'
  },
  {
    id: 'quyuan',
    title: '曲院风荷',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/quyuan-lotus.jpg'),
    note: '曲院风荷荷塘景观'
  },
  {
    id: 'sudi',
    title: '苏堤春晓',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/sudi-spring.jpg'),
    note: '苏堤春景与长堤空间'
  },
  {
    id: 'huagang',
    title: '花港观鱼',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/huagang-fish.jpg'),
    note: '花港观鱼园林水池'
  },
  {
    id: 'santan',
    title: '三潭印月',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/santan-three-pools.jpg'),
    note: '三潭印月湖中石塔'
  },
  {
    id: 'leifeng',
    title: '雷峰夕照',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/leifeng-evening.jpg'),
    note: '雷峰塔与夕照景观'
  },
  {
    id: 'nanping',
    title: '南屏晚钟',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/nanping-evening-bell-1911.jpg'),
    note: '1911 年二我轩照相馆南屏晚钟影像'
  },
  {
    id: 'liulang',
    title: '柳浪闻莺',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/liulang-willows.jpg'),
    note: '柳浪闻莺湖东园景'
  },
  {
    id: 'hubin',
    title: '湖滨晴雨',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/hubin-west-lake-view.jpg'),
    note: '湖滨视角下的西湖与城市边界'
  },
  {
    id: 'shuangfeng',
    title: '双峰插云',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/shuangfeng-national-stele.jpg'),
    note: '双峰插云国保碑，记录南北高峰与云气相接的经典题名'
  },
  {
    id: 'shuangfeng-scroll',
    title: '叶肖岩两峰插云',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/ye-xiaoyan-twin-peaks.jpg'),
    note: '宋代西湖十景图中的两峰插云图像，可用于对比历史画意与今日景点'
  },
  {
    id: 'historic-map-1916',
    title: '1916 西湖最新地图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/historic-west-lake-map-1916.png'),
    note: '民国时期西湖地图史料'
  },
  {
    id: 'westlake-scroll',
    title: '李嵩西湖图卷',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/li-song-west-lake-scroll.jpg'),
    note: '南宋画作中的西湖空间想象'
  },
  {
    id: 'west-lake-area-map',
    title: '西湖景区地形图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/full-west-lake-area-map.jpg'),
    note: '覆盖西湖水面、周边山体、道路和主要地名'
  },
  {
    id: 'hangzhou-topographic-map',
    title: '杭州地形测绘图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/hangzhou-topographic-map-1939.jpg'),
    note: '民国时期杭州附近地形测绘图，用作地图质感和地形语境参考'
  },
  {
    id: 'terrain-west-lake',
    title: '西湖地形底图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/full-west-lake-area-map.jpg'),
    note: '西湖地形底图'
  }
];

export const westLakeAssetsById = Object.fromEntries(westLakeAssets.map(asset => [asset.id, asset]));
