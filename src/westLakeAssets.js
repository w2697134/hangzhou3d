const assetBasePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const fromAssetBase = path => `${assetBasePath}${path}`;

export const westLakeAssets = [
  {
    id: 'duanqiao',
    title: '断桥残雪',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/duanqiao-broken-bridge.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Broken_Bridge_(Hangzhou)_20250505.jpg',
    source: 'Wikimedia Commons',
    author: 'Suicasmo',
    license: 'CC0',
    creditShort: 'Suicasmo · CC0',
    note: '白堤东端与断桥景观'
  },
  {
    id: 'baidi',
    title: '白堤',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/baidi-causeway.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Bai_Causeway,_West_Lake_%E8%A5%BF%E6%B9%96%E7%99%BD%E5%A0%A4_-_panoramio.jpg',
    source: 'Wikimedia Commons',
    author: 'lienyuan lee',
    license: 'CC BY 3.0',
    creditShort: 'lienyuan lee · CC BY 3.0',
    note: '西湖北岸白堤步行线'
  },
  {
    id: 'pinghu',
    title: '平湖秋月',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/pinghu-autumn-moon.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Autumn_Moon_Over_the_Calm_Lake.jpg',
    source: 'Wikimedia Commons',
    author: '钉钉',
    license: 'CC BY-SA 4.0',
    creditShort: '钉钉 · CC BY-SA 4.0',
    note: '平湖秋月观景区'
  },
  {
    id: 'quyuan',
    title: '曲院风荷',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/quyuan-lotus.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:China_Hangzhou_Lotus_in_the_Breeze_at_the_Winding_Courtyard.JPG',
    source: 'Wikimedia Commons',
    author: 'Zh:User:Mywood',
    license: 'Public domain',
    creditShort: 'Zh:User:Mywood · Public domain',
    note: '曲院风荷荷塘景观'
  },
  {
    id: 'sudi',
    title: '苏堤春晓',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/sudi-spring.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Su_Causeway_near_West_Lake,_looking_towards_north_20120529_1.jpg',
    source: 'Wikimedia Commons',
    author: 'DXR',
    license: 'CC BY-SA 4.0',
    creditShort: 'DXR · CC BY-SA 4.0',
    note: '苏堤春景与长堤空间'
  },
  {
    id: 'huagang',
    title: '花港观鱼',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/huagang-fish.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%E8%8A%B1%E6%B8%AF%E8%A7%82%E9%B1%BC.jpg',
    source: 'Wikimedia Commons',
    author: '钉钉',
    license: 'CC BY-SA 4.0',
    creditShort: '钉钉 · CC BY-SA 4.0',
    note: '花港观鱼园林水池'
  },
  {
    id: 'santan',
    title: '三潭印月',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/santan-three-pools.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:2014.11.21.111900_Three_Pools_Mirroring_the_Moon_Xihu_Hangzhou.jpg',
    source: 'Wikimedia Commons',
    author: 'Hermann Luyken',
    license: 'CC0',
    creditShort: 'Hermann Luyken · CC0',
    note: '三潭印月湖中石塔'
  },
  {
    id: 'leifeng',
    title: '雷峰夕照',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/leifeng-evening.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Leifeng_Pagoda_20250505.jpg',
    source: 'Wikimedia Commons',
    author: 'Suicasmo',
    license: 'CC0',
    creditShort: 'Suicasmo · CC0',
    note: '雷峰塔与夕照景观'
  },
  {
    id: 'nanping',
    title: '南屏晚钟',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/nanping-evening-bell-1911.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Evening_Bell_Ringing_at_the_Nanping_Hill_taken_by_Erwoxuan_Photo_Studio,_1911.jpg',
    source: 'Wikimedia Commons',
    author: '杭州二我轩照相馆',
    license: 'Public domain',
    creditShort: '杭州二我轩照相馆 · Public domain',
    note: '1911 年二我轩照相馆南屏晚钟影像'
  },
  {
    id: 'liulang',
    title: '柳浪闻莺',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/liulang-willows.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Orioles_Singing_in_the_Willows_2025.06.jpg',
    source: 'Wikimedia Commons',
    author: 'Shujianyang',
    license: 'CC BY-SA 4.0',
    creditShort: 'Shujianyang · CC BY-SA 4.0',
    note: '柳浪闻莺湖东园景'
  },
  {
    id: 'hubin',
    title: '湖滨晴雨',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/hubin-west-lake-view.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:2014.11.21.083756_View_Xihu_Hangzhou.jpg',
    source: 'Wikimedia Commons',
    author: 'Hermann Luyken',
    license: 'CC0',
    creditShort: 'Hermann Luyken · CC0',
    note: '湖滨视角下的西湖与城市边界'
  },
  {
    id: 'shuangfeng',
    title: '双峰插云',
    kind: 'photo',
    src: fromAssetBase('/assets/westlake/shuangfeng-national-stele.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%E5%8F%8C%E5%B3%B0%E6%8F%92%E4%BA%91%E5%9B%BD%E4%BF%9D%E7%A2%91.JPG',
    source: 'Wikimedia Commons',
    author: 'Nekitarc',
    license: 'CC BY-SA 4.0',
    creditShort: 'Nekitarc · CC BY-SA 4.0',
    note: '双峰插云国保碑，记录南北高峰与云气相接的经典题名'
  },
  {
    id: 'shuangfeng-scroll',
    title: '叶肖岩两峰插云',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/ye-xiaoyan-twin-peaks.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%E5%AE%8B_%E8%91%89%E8%82%96%E5%B7%96_%E8%A5%BF%E6%B9%96%E5%8D%81%E6%99%AF%E5%9C%96_%E5%85%A9%E5%B3%B0%E6%8F%92%E9%9B%B2.jpg',
    source: 'Wikimedia Commons / National Palace Museum',
    author: 'Ye Xiaoyan',
    license: 'Public domain',
    creditShort: 'Ye Xiaoyan · Public domain',
    note: '宋代西湖十景图中的两峰插云图像，可用于对比历史画意与今日景点'
  },
  {
    id: 'historic-map-1916',
    title: '1916 西湖最新地图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/historic-west-lake-map-1916.png'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:The_latest_map_of_West_Lake_1916.png',
    source: 'Wikimedia Commons',
    author: 'Xinji Bookstore',
    license: 'Public domain',
    creditShort: 'Xinji Bookstore · Public domain',
    note: '民国时期西湖地图史料'
  },
  {
    id: 'westlake-scroll',
    title: '李嵩西湖图卷',
    kind: 'archive',
    src: fromAssetBase('/assets/westlake/li-song-west-lake-scroll.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%E6%9D%8E%E5%B5%A9_%E8%A5%BF%E6%B9%96%E5%9B%BE%E5%8D%B7.jpg',
    source: 'Wikimedia Commons',
    author: 'Li Song',
    license: 'Public domain',
    creditShort: 'Li Song · Public domain',
    note: '南宋画作中的西湖空间想象'
  },
  {
    id: 'west-lake-area-map',
    title: '西湖景区地形图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/full-west-lake-area-map.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Full_map_of_West_Lake_Area.jpg',
    source: 'Wikimedia Commons / OpenStreetMap contributors',
    author: 'OpenStreetMap contributors',
    license: 'CC BY-SA 2.5',
    creditShort: 'OpenStreetMap contributors',
    note: '真实公开地图素材，覆盖西湖水面、周边山体、道路和主要地名'
  },
  {
    id: 'hangzhou-topographic-map',
    title: '杭州地形测绘图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/hangzhou-topographic-map-1939.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%E3%80%8A%E6%9D%AD%E5%B7%9E%E9%99%84%E8%BF%91%E5%9C%B0%E5%BD%A2%E5%9C%96%E3%80%8B_%E6%9D%AD%E5%B7%9E%E5%B8%82(%E6%B8%85%E7%B9%AA%E5%9C%96)_%E6%B0%91%E5%9C%8B18%E5%B9%B4%E6%B8%AC%E5%9C%96%EF%BC%8C28%E5%B9%B4%E7%B8%AE%E8%A3%BD.jpg',
    source: 'Wikimedia Commons',
    author: '联勤总部陆地测量总局测量第一队',
    license: 'Public domain',
    creditShort: '民国测绘图',
    note: '民国时期杭州附近地形测绘图，用作地图质感和地形语境参考'
  },
  {
    id: 'terrain-west-lake',
    title: '西湖地形底图',
    kind: 'map',
    src: fromAssetBase('/assets/westlake/full-west-lake-area-map.jpg'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Full_map_of_West_Lake_Area.jpg',
    source: 'Wikimedia Commons / OpenStreetMap contributors',
    author: 'OpenStreetMap contributors',
    license: 'CC BY-SA 2.5',
    creditShort: 'OpenStreetMap contributors',
    note: '真实公开地图素材，替代早期项目内自绘底图'
  }
];

export const westLakeAssetsById = Object.fromEntries(westLakeAssets.map(asset => [asset.id, asset]));
