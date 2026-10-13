/*
 * WayLog 퍼블리싱 데모 데이터
 * 원본 서비스는 한국관광공사 TourAPI 실데이터를 쓰지만, 퍼블리싱본은 화면 확인용 고정 데이터를 쓴다.
 * 장소 이름 · 주소 · 좌표는 실제 장소를 참고했고, 운영 정보 · 행사 · 게시물 내용은 데모용이다.
 */
window.WAYLOG = (function () {
  var TODAY = '2026-10-13';

  var me = { id: 'u1', nickname: '바다산책', email: 'traveler@waylog.kr', joined: '2026-05-02', bio: '바다가 보이는 길을 따라 걷습니다.' };

  var regions = [
    { id: 'seoul', name: '서울', en: 'SEOUL', lat: 37.5665, lng: 126.978, image: 'region-seoul', desc: '궁궐과 남산, 한강이 한 도시 안에' },
    { id: 'gyeonggi', name: '경기 · 인천', en: 'GYEONGGI', lat: 37.4563, lng: 126.7052, image: 'region-gyeonggi', desc: '수도권 가까이 만나는 호수와 바다' },
    { id: 'gangwon', name: '강원', en: 'GANGWON', lat: 37.8813, lng: 127.7298, image: 'region-gangwon', desc: '설악의 능선과 동해 바다' },
    { id: 'chungcheong', name: '충청', en: 'CHUNGCHEONG', lat: 36.4465, lng: 127.119, image: 'region-chungcheong', desc: '백제의 성곽과 금강 물길' },
    { id: 'gyeongsang', name: '경상', en: 'GYEONGSANG', lat: 35.8562, lng: 129.2247, image: 'region-gyeongsang', desc: '천년 고도 경주와 남해 섬' },
    { id: 'jeolla', name: '전라', en: 'JEOLLA', lat: 34.8879, lng: 127.5097, image: 'region-jeolla', desc: '갈대 습지와 한옥 골목' },
    { id: 'busan', name: '부산', en: 'BUSAN', lat: 35.1796, lng: 129.0756, image: 'region-busan', desc: '바다 위 다리와 해변의 야경' },
    { id: 'jeju', name: '제주', en: 'JEJU', lat: 33.4996, lng: 126.5312, image: 'region-jeju', desc: '오름과 숲길, 돌담 너머 바다' }
  ];

  var TYPES = { attraction: '관광지', culture: '문화시설' };

  var places = [
    { id: 'p1', type: 'attraction', region: 'jeju', name: '성산일출봉', image: 'region-jeju', lat: 33.458, lng: 126.9425, address: '제주 서귀포시 성산읍 일출로 284-12', hours: '07:00 – 20:00 (입장 마감 19:00)', closed: '매월 첫째 월요일', tel: '064-783-0959', parking: '가능 (유료)', fee: '어른 5,000원', views: 4820, updated: '2026-10-10', tags: ['유네스코', '일출', '오름'], desc: '바다에서 솟아오른 수성화산으로, 정상의 분화구와 해안 절벽이 함께 보이는 제주의 대표 명소입니다. 봄에는 주변 유채꽃밭이 노랗게 물듭니다.' },
    { id: 'p2', type: 'attraction', region: 'jeju', name: '사려니숲길', image: 'course-jeju', lat: 33.4105, lng: 126.672, address: '제주 제주시 조천읍 교래리 산 137-1', hours: '상시 개방 (일몰 전 탐방 권장)', closed: '없음 (기상 악화 시 통제)', tel: '064-900-8800', parking: '가능 (무료)', fee: '무료', views: 3110, updated: '2026-10-08', tags: ['숲길', '산책', '삼나무'], desc: '삼나무와 졸참나무가 빽빽한 약 10km의 숲길입니다. 경사가 완만해 아이와 함께 걷기 좋고, 비 온 뒤에는 숲 냄새가 진합니다.' },
    { id: 'p3', type: 'attraction', region: 'busan', name: '광안대교', image: 'region-busan', lat: 35.1475, lng: 129.13, address: '부산 수영구 광안해변로 219', hours: '경관 조명 일몰 – 24:00', closed: '없음', tel: '051-610-4000', parking: '광안리 공영주차장 이용', fee: '무료', views: 5270, updated: '2026-10-11', tags: ['야경', '해변', '드라이브'], desc: '광안리 해변 앞 바다를 가로지르는 현수교입니다. 해가 지면 다리 전체에 조명이 켜져 해변 산책로에서 야경을 보기 좋습니다.' },
    { id: 'p4', type: 'attraction', region: 'busan', name: '해운대해수욕장', image: 'news-busan', lat: 35.1587, lng: 129.1604, address: '부산 해운대구 우동', hours: '상시 개방 (해수욕 기간 09:00 – 18:00)', closed: '없음', tel: '051-749-7621', parking: '가능 (유료)', fee: '무료', views: 6040, updated: '2026-09-30', tags: ['해변', '가족 여행'], desc: '1.5km 길이의 넓은 백사장과 고층 빌딩 스카이라인이 어우러진 부산의 대표 해변입니다.' },
    { id: 'p5', type: 'attraction', region: 'gangwon', name: '설악산 국립공원', image: 'region-gangwon', lat: 38.119, lng: 128.4654, address: '강원 속초시 설악산로 833', hours: '탐방로별 입산 시간 상이', closed: '산불 조심 기간 일부 통제', tel: '033-801-0900', parking: '가능 (유료)', fee: '무료', views: 3890, updated: '2026-10-09', tags: ['단풍', '등산'], desc: '울산바위와 권금성 등 화강암 봉우리가 이어지는 국립공원입니다. 10월 중순 단풍이 가장 아름답습니다.' },
    { id: 'p6', type: 'attraction', region: 'chungcheong', name: '공주 공산성', image: 'region-chungcheong', lat: 36.4627, lng: 127.1232, address: '충남 공주시 웅진로 280', hours: '09:00 – 18:00', closed: '1월 1일, 설날 · 추석 당일', tel: '041-840-8811', parking: '가능 (무료)', fee: '어른 1,200원', views: 1460, updated: '2026-10-02', tags: ['유네스코', '백제', '성곽'], desc: '금강을 따라 이어진 백제 웅진 시대의 산성입니다. 성곽길을 한 바퀴 돌면 강과 공주 시내가 한눈에 들어옵니다.' },
    { id: 'p7', type: 'attraction', region: 'gyeongsang', name: '경주 첨성대', image: 'region-gyeongsang', lat: 35.8347, lng: 129.219, address: '경북 경주시 인왕동 839-1', hours: '09:00 – 22:00', closed: '없음', tel: '054-779-8744', parking: '인근 공영주차장', fee: '무료', views: 4210, updated: '2026-10-07', tags: ['신라', '야경', '꽃밭'], desc: '신라 선덕여왕 때 세운 천문 관측대입니다. 가을에는 주변 꽃단지에 핑크뮬리와 코스모스가 핍니다.' },
    { id: 'p8', type: 'attraction', region: 'jeolla', name: '순천만습지', image: 'region-jeolla', lat: 34.8858, lng: 127.5094, address: '전남 순천시 순천만길 513-25', hours: '08:00 – 일몰 시까지', closed: '없음', tel: '061-749-6052', parking: '가능 (유료)', fee: '어른 10,000원 (국가정원 통합)', views: 3720, updated: '2026-10-12', tags: ['갈대', '노을', '생태'], desc: 'S자로 굽은 물길과 갈대밭이 펼쳐진 연안 습지입니다. 용산전망대에서 보는 해 질 녘 풍경이 특히 유명합니다.' },
    { id: 'p9', type: 'attraction', region: 'jeolla', name: '전주 한옥마을', image: 'theme-history', lat: 35.815, lng: 127.153, address: '전북 전주시 완산구 기린대로 99', hours: '상시 개방 (시설별 상이)', closed: '없음', tel: '063-282-1330', parking: '공영주차장 이용', fee: '무료', views: 5580, updated: '2026-10-05', tags: ['한옥', '골목', '한복'], desc: '700여 채의 한옥이 모여 있는 마을입니다. 오목대에 오르면 기와지붕이 이어진 풍경을 내려다볼 수 있습니다.' },
    { id: 'p10', type: 'attraction', region: 'seoul', name: '남산서울타워', image: 'region-seoul', lat: 37.5512, lng: 126.9882, address: '서울 용산구 남산공원길 105', hours: '10:30 – 23:00', closed: '없음', tel: '02-3455-9277', parking: '불가 (대중교통 이용)', fee: '전망대 어른 26,000원', views: 6890, updated: '2026-10-11', tags: ['야경', '전망대'], desc: '남산 정상에 선 전망 타워입니다. 봄에는 남산 순환로 벚꽃길과 함께 서울 도심을 내려다볼 수 있습니다.' },
    { id: 'p11', type: 'attraction', region: 'seoul', name: '북한산 백운대', image: 'login-background', lat: 37.6587, lng: 126.9779, address: '서울 강북구 우이동 산 1-1', hours: '일출 – 일몰', closed: '기상 악화 시 통제', tel: '02-909-0497', parking: '우이동 공영주차장', fee: '무료', views: 2350, updated: '2026-09-28', tags: ['등산', '능선'], desc: '북한산의 최고봉으로, 정상 암릉에서 서울 북쪽 산줄기와 도심이 함께 보입니다.' },
    { id: 'p12', type: 'attraction', region: 'gyeonggi', name: '송도 센트럴파크', image: 'region-gyeonggi', lat: 37.3925, lng: 126.6395, address: '인천 연수구 컨벤시아대로 160', hours: '상시 개방', closed: '없음', tel: '032-721-4415', parking: '가능 (유료)', fee: '무료', views: 1980, updated: '2026-10-03', tags: ['수상택시', '공원', '도심'], desc: '바닷물을 끌어온 수로를 따라 조성된 도심 공원입니다. 수상택시와 카약을 타고 고층 빌딩 사이를 지날 수 있습니다.' },
    { id: 'p13', type: 'culture', region: 'seoul', name: '국립중앙박물관', image: 'type-culture', lat: 37.524, lng: 126.9804, address: '서울 용산구 서빙고로 137', hours: '10:00 – 18:00 (수 · 토 21:00까지)', closed: '1월 1일, 설날 · 추석 당일', tel: '02-2077-9000', parking: '가능 (유료)', fee: '상설전시 무료', views: 4470, updated: '2026-10-10', tags: ['박물관', '실내', '가족 여행'], desc: '선사 시대부터 조선 시대까지 우리 역사를 한 번에 볼 수 있는 국내 최대 박물관입니다. 비 오는 날 여행지로도 좋습니다.' },
    { id: 'p14', type: 'culture', region: 'seoul', name: '국립현대미술관 서울', image: 'culture-museum', lat: 37.5788, lng: 126.98, address: '서울 종로구 삼청로 30', hours: '10:00 – 18:00 (수 · 토 21:00까지)', closed: '1월 1일, 설날 · 추석 당일', tel: '02-3701-9500', parking: '불가', fee: '전시별 상이', views: 2610, updated: '2026-10-06', tags: ['미술관', '현대미술'], desc: '경복궁 옆 옛 기무사 터에 자리한 미술관으로, 국내외 현대미술 기획전을 엽니다.' }
  ];

  var courses = [
    { id: 'c1', title: '제주 동쪽 숲과 바다 1박 2일', region: 'jeju', days: '1박 2일', theme: '자연 · 힐링', image: 'course-jeju', author: 'WayLog 에디터', desc: '삼나무 숲길을 걷고 성산에서 해돋이를 본 뒤, 동쪽 해안을 따라 섭지코지와 함덕까지 이어지는 코스입니다.',
      stops: [
        { name: '제주국제공항', lat: 33.5104, lng: 126.4914, time: '1일차 10:00', note: '렌터카 인수 후 동쪽으로 출발' },
        { name: '사려니숲길', place: 'p2', lat: 33.4105, lng: 126.672, time: '1일차 11:00', note: '물찻오름 입구까지 왕복 2시간' },
        { name: '성산일출봉', place: 'p1', lat: 33.458, lng: 126.9425, time: '2일차 06:30', note: '일출 30분 전 입장' },
        { name: '섭지코지', lat: 33.424, lng: 126.931, time: '2일차 09:30', note: '해안 산책로 한 바퀴' },
        { name: '함덕해수욕장', lat: 33.5432, lng: 126.6699, time: '2일차 14:00', note: '에메랄드빛 바다와 서우봉' }
      ] },
    { id: 'c2', title: '부산 바다 야경 당일치기', region: 'busan', days: '당일', theme: '야경 · 해변', image: 'region-busan', author: 'WayLog 에디터', desc: '오후에는 해운대와 동백섬을 걷고, 해가 지면 광안리로 옮겨 광안대교 야경을 보는 코스입니다.',
      stops: [
        { name: '감천문화마을', lat: 35.0975, lng: 129.0106, time: '13:00', note: '골목 벽화와 전망대' },
        { name: '해운대해수욕장', place: 'p4', lat: 35.1587, lng: 129.1604, time: '15:30', note: '해변 산책' },
        { name: '동백섬', lat: 35.153, lng: 129.152, time: '17:00', note: '누리마루와 해안 데크길' },
        { name: '광안대교', place: 'p3', lat: 35.1475, lng: 129.13, time: '19:00', note: '광안리 해변에서 야경' }
      ] },
    { id: 'c3', title: '경주 신라 역사 산책', region: 'gyeongsang', days: '당일', theme: '역사 · 도보', image: 'region-gyeongsang', author: 'WayLog 에디터', desc: '걸어서 이동할 수 있는 대릉원 일대를 돌고 동궁과 월지의 야경으로 마무리합니다.',
      stops: [
        { name: '황리단길', lat: 35.8383, lng: 129.2098, time: '11:00', note: '점심과 카페' },
        { name: '대릉원', lat: 35.8382, lng: 129.2116, time: '13:00', note: '천마총 내부 관람' },
        { name: '경주 첨성대', place: 'p7', lat: 35.8347, lng: 129.219, time: '15:00', note: '주변 꽃단지 산책' },
        { name: '동궁과 월지', lat: 35.8347, lng: 129.2266, time: '18:30', note: '연못에 비친 야경' }
      ] },
    { id: 'c4', title: '순천 · 여수 남도 바다 1박 2일', region: 'jeolla', days: '1박 2일', theme: '노을 · 미식', image: 'region-jeolla', author: 'WayLog 에디터', desc: '순천만 갈대밭의 노을을 보고, 다음 날 여수 바다와 낭만포차 거리로 이어집니다.',
      stops: [
        { name: '순천만국가정원', lat: 34.9302, lng: 127.5096, time: '1일차 11:00', note: '정원 박람회장 산책' },
        { name: '순천만습지', place: 'p8', lat: 34.8858, lng: 127.5094, time: '1일차 16:30', note: '용산전망대 노을' },
        { name: '오동도', lat: 34.7445, lng: 127.7672, time: '2일차 10:00', note: '동백숲 산책로' },
        { name: '여수 낭만포차 거리', lat: 34.7385, lng: 127.7362, time: '2일차 19:00', note: '해산물과 밤바다' }
      ] }
  ];

  var enjoyCategories = [
    { id: 'festivals', name: '축제 · 행사', icon: 'sparkle', image: 'category-festival', desc: '계절마다 펼쳐지는 지역의 축제와 특별한 행사를 만나 보세요.' },
    { id: 'leports', name: '레포츠', icon: 'mountain', image: 'category-leports', desc: '여행지의 자연을 온몸으로 경험하는 액티비티를 찾아보세요.' },
    { id: 'food', name: '음식점', icon: 'utensils', image: 'category-food', desc: '지역의 재료와 이야기가 담긴 맛을 경험해 보세요.' },
    { id: 'shopping', name: '쇼핑', icon: 'bag', image: 'category-shopping', desc: '전통시장과 지역 특산품에서 여행의 기억을 담아 보세요.' },
    { id: 'stay', name: '숙박', icon: 'bed', image: 'category-stay', desc: '여행의 하루를 편안하게 마무리할 숙소를 확인해 보세요.' }
  ];

  var enjoy = [
    { id: 'e1', category: 'festivals', region: 'gyeongsang', name: '신라문화제', image: 'theme-history', start: '2026-10-09', end: '2026-10-18', place: '경주 황성공원 일대', desc: '신라 천년의 역사를 퍼레이드와 공연으로 재현하는 경주의 대표 가을 축제입니다.' },
    { id: 'e2', category: 'festivals', region: 'jeolla', name: '순천만 갈대축제', image: 'region-jeolla', start: '2026-10-30', end: '2026-11-01', place: '순천만습지', desc: '갈대가 가장 풍성한 시기에 열리는 생태 축제입니다. 갈대숲 음악회와 탐조 프로그램이 열립니다.' },
    { id: 'e3', category: 'festivals', region: 'busan', name: '부산불꽃축제', image: 'category-festival', start: '2026-11-07', end: '2026-11-07', place: '광안리해수욕장', desc: '광안대교를 배경으로 수만 발의 불꽃이 바다 위를 수놓는 축제입니다.' },
    { id: 'e4', category: 'festivals', region: 'jeju', name: '서귀포 유채꽃축제', image: 'region-jeju', start: '2027-03-20', end: '2027-03-22', place: '서귀포 가시리 녹산로', desc: '노란 유채꽃과 벚꽃이 함께 피는 녹산로에서 열리는 봄 축제입니다.' },
    { id: 'e5', category: 'festivals', region: 'seoul', name: '서울 빛초롱축제', image: 'region-seoul', start: '2026-09-20', end: '2026-10-05', place: '청계천 일대', desc: '청계천 물길을 따라 등불 작품을 전시하는 야간 축제입니다.' },
    { id: 'e6', category: 'leports', region: 'gangwon', name: '영월 동강 카약 투어', image: 'theme-experience', place: '강원 영월군 영월읍', desc: '협곡 사이 잔잔한 물길을 따라 2시간 동안 노를 젓는 초보자용 카약 투어입니다.' },
    { id: 'e7', category: 'leports', region: 'seoul', name: '북한산 암릉 트레킹', image: 'category-leports', place: '서울 강북구 우이동', desc: '전문 가이드와 함께 안전 장비를 갖추고 백운대 암릉 구간을 오릅니다.' },
    { id: 'e8', category: 'food', region: 'gyeongsang', name: '통영 바다 앞 충무김밥', image: 'category-food', place: '경남 통영시 통영해안로', desc: '바다가 보이는 창가에서 오징어무침, 섞박지와 함께 먹는 충무김밥입니다.' },
    { id: 'e9', category: 'shopping', region: 'seoul', name: '명동 쇼핑 거리', image: 'category-shopping', place: '서울 중구 명동길', desc: '화장품 가게와 길거리 음식 노점이 이어지는 서울의 대표 쇼핑 거리입니다.' },
    { id: 'e10', category: 'stay', region: 'gangwon', name: '속초 오션뷰 스테이', image: 'category-stay', place: '강원 속초시 해오름로', desc: '모든 객실에서 동해가 보이는 숙소입니다. 체크인 15:00 · 체크아웃 11:00.' }
  ];

  var users = {
    u1: { id: 'u1', nickname: '바다산책', image: null },
    u2: { id: 'u2', nickname: '숲길걷기', image: 'destination-jeju' },
    u3: { id: 'u3', nickname: '야경수집가', image: null },
    u4: { id: 'u4', nickname: '느린여행자', image: null }
  };

  var posts = [
    { id: 'f1', author: 'u2', date: '2026-10-12T19:40:00', place: 'p2', course: 'c1', images: ['course-jeju', 'destination-jeju'], text: '비 그친 다음 날 아침에 걸은 사려니숲길. 삼나무 사이로 안개가 깔려서 걷는 내내 조용했어요. 물찻오름 입구까지는 경사가 거의 없어서 천천히 걸어도 왕복 2시간이면 충분합니다.', tags: ['제주', '숲길', '아침산책'], likes: 48, comments: [
      { id: 'cm1', author: 'u4', date: '2026-10-12T21:02:00', text: '다음 달에 가는데 신발은 운동화면 될까요?' },
      { id: 'cm2', author: 'u2', date: '2026-10-12T21:30:00', text: '네, 길이 잘 다져져 있어서 운동화로 충분해요!' }
    ] },
    { id: 'f2', author: 'u3', date: '2026-10-11T22:15:00', place: 'p3', course: 'c2', images: ['region-busan'], text: '광안리 해변 계단에 앉아서 본 광안대교. 21시 정각에 조명 색이 바뀌니 그 시간에 맞춰 가 보세요.', tags: ['부산', '야경'], likes: 112, comments: [
      { id: 'cm3', author: 'u1', date: '2026-10-11T23:01:00', text: '사진 색감이 너무 좋네요. 어디서 찍으셨어요?' }
    ] },
    { id: 'f3', author: 'u1', date: '2026-10-10T17:20:00', place: 'p8', course: 'c4', images: ['region-jeolla', 'hero-main'], text: '순천만 용산전망대까지 40분 정도 걸어서 올라갔어요. 해 지기 30분 전에 도착하니 S자 물길에 노을이 비치는 장면을 볼 수 있었습니다.', tags: ['순천', '노을', '갈대'], likes: 76, comments: [] },
    { id: 'f4', author: 'u4', date: '2026-10-08T13:05:00', place: 'p7', course: 'c3', images: ['region-gyeongsang'], text: '첨성대 옆 꽃단지에 핑크뮬리가 한창이에요. 평일 오전에 가니 사람이 적어서 여유로웠습니다.', tags: ['경주', '가을꽃'], likes: 39, comments: [] },
    { id: 'f5', author: 'u2', date: '2026-10-05T10:48:00', place: 'p1', course: null, images: ['region-jeju'], text: '성산일출봉 정상에서 본 분화구. 계단이 꽤 가파르니 물 한 병은 꼭 챙기세요.', tags: ['제주', '오름'], likes: 54, comments: [] },
    { id: 'f6', author: 'u3', date: '2026-10-02T20:30:00', place: 'p10', course: null, images: ['region-seoul'], text: '남산 순환로를 걸어 올라가서 타워까지. 케이블카 줄이 길 때는 걸어서 올라가는 것도 괜찮아요.', tags: ['서울', '남산'], likes: 27, comments: [] },
    { id: 'f7', author: 'u1', date: '2026-09-28T09:12:00', place: 'p13', course: null, images: ['type-culture'], text: '비 오는 날 국립중앙박물관. 사유의 방은 꼭 들러 보세요. 조명이 어두워서 천천히 머물게 됩니다.', tags: ['서울', '박물관', '비오는날'], likes: 61, comments: [] },
    { id: 'f8', author: 'u4', date: '2026-09-21T16:40:00', place: 'p6', course: null, images: ['region-chungcheong'], text: '공산성 성곽길 한 바퀴. 금강 쪽 성벽 위에서 보는 풍경이 이렇게 좋을 줄 몰랐어요.', tags: ['공주', '성곽'], likes: 22, comments: [] }
  ];

  var notices = [
    { id: 'n1', date: '2026-10-10', title: '10월 단풍 시즌 추천 여행지가 업데이트되었습니다.' },
    { id: 'n2', date: '2026-10-01', title: '여행 피드에 여행코스 태그 기능이 추가되었습니다.' },
    { id: 'n3', date: '2026-09-18', title: '추석 연휴 기간 고객센터 운영 안내' }
  ];

  return {
    today: TODAY,
    me: me,
    regions: regions,
    types: TYPES,
    places: places,
    courses: courses,
    enjoyCategories: enjoyCategories,
    enjoy: enjoy,
    users: users,
    posts: posts,
    notices: notices
  };
})();
