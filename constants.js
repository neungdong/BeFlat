const faclTypeIdList_Marker = {
  "UC0H03,UC0H02,UC0H04,UC0H05": "복지시설",
  "UC0H01,UC0G02,UC0G03,UC0G04,UC0G05,UC0G06,UC0G07,UC0G01,UC0G08,UC0A15":
    "보육_교육시설",
  "UC0A05,UC0A03,UC0A04,UC0A06,UC0A07,UC0A08,UC0A09,UC0A10,UC0A11,UC0A12,UC0A13,UC0K01,UC0K02,UC0K03,UC0K04,UC0K05,UC0K06,UC0O01,UC0O02":
    "공공기관",
  "UC0F01,UC0F02,UC0F03,UC0A14,UC0S01": "의료기관",
  "UC0A01,UC0A02,UC0B03,UC0C01,UC0C02,UC0C03,UC0C04,UC0C05,UC0D01,UC0E01,UC0I01,UC0I02,UC0J01,UC0J02,UC0L01,UC0L02,UC0M01,UC0N01,UC0N02,UC0P01,UC0Q01,UC0Q02,UC0R01,UC0R02,UC0T01,UC0T02,UC0U01,UC0U02,UC0U03,UC0U04,UC0V01":
    "편의시설",
  UC0B01: "일반음식점",
  UC0B02: "휴게음식점_제과점",
};

const markerImages = {
  복지시설: "../assets/시설유형/복지시설.png",
  보육_교육시설: "../assets/시설유형/보육_교육시설.png",
  공공기관: "../assets/시설유형/공공기관.png",
  의료기관: "../assets/시설유형/의료기관.png",
  편의시설: "../assets/시설유형/편의시설.png",
  일반음식점: "../assets/시설유형/일반음식점.png",
  휴게음식점_제과점: "../assets/시설유형/휴게음식점_제과점.png",
};

const faclTypeIdList = [
  "UC0H03,UC0H02,UC0H04,UC0H05", // 복지시설
  "UC0H01,UC0G02,UC0G03,UC0G04,UC0G05,UC0G06,UC0G07,UC0G01,UC0G08,UC0A15", //보육/교육시설
  "UC0A05,UC0A03,UC0A04,UC0A06,UC0A07,UC0A08,UC0A09,UC0A10,UC0A11,UC0A12,UC0A13,UC0K01,UC0K02,UC0K03,UC0K04,UC0K05,UC0K06,UC0O01,UC0O02", //공공기관
  "UC0F01,UC0F02,UC0F03,UC0A14,UC0S01", //의료기관
  "UC0A01,UC0A02,UC0B03,UC0C01,UC0C02,UC0C03,UC0C04,UC0C05,UC0D01,UC0E01,UC0I01,UC0I02,UC0J01,UC0J02,UC0L01,UC0L02,UC0M01,UC0N01,UC0N02,UC0P01,UC0Q01,UC0Q02,UC0R01,UC0R02,UC0T01,UC0T02,UC0U01,UC0U02,UC0U03,UC0U04,UC0V01", //편의시설
  "UC0B01", //일반음식점
  "UC0B02", //휴게음식점/제과점
];

const convenienceTypeKeywords = {
  convTy1: ["주출입구 접근로"],
  convTy2: ["주출입문"],
  convTy3: ["승강기"],
  convTy4: ["장애인전용주차구역"],
  convTy5: ["장애인사용가능화장실"],
  convTy6: ["장애인사용가능객실"],
  convTy7: ["안내설비"],
  convTy8: ["주출입구 높이차이 제거(경사로)"],
};

const convenienceIcons = {
  승강기: "../assets/승강기.png",
  안내설비: "../assets/안내설비.png",
  장애인전용주차구역: "../assets/장애인전용주차구역.png",
  장애인사용가능화장실: "../assets/장애인 화장실.png",
  장애인사용가능객실: "../assets/장애인사용가능객실.png",
  "주출입구 높이차이 제거(경사로)":
    "../assets/주출입구 높이차이 제거(경사로).png",
  "주출입구 접근로": "../assets/주출입구 접근로.png",
  주출입문: "../assets/주출입문.png",
};
const convenienceTypeDisplayNames = {
  장애인전용주차구역: "장애인전용주차",
  장애인사용가능화장실: "장애인전용화장실",
  장애인사용가능객실: "장애인전용객실",
  "주출입구 높이차이 제거(경사로)": "경사로",
};
