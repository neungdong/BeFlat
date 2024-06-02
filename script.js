document.addEventListener("DOMContentLoaded", function () {
  const bottomSheet = document.getElementById("bottomSheet");
  const bottomSheetHandle = document.getElementById("bottomSheetHandle");
  const locationButton = document.getElementById("locationButton");
  const filterApplyButton = document.getElementById("filterApplyButton");
  const searchButton = document.getElementById("searchButton");
  const searchInput = document.getElementById("searchInput");

  bottomSheetHandle.addEventListener("click", function () {
    bottomSheet.classList.toggle("show");
  });

  locationButton.addEventListener("click", function () {
    moveToCurrentLocation();
  });

  filterApplyButton.addEventListener("click", function () {
    fetchXmlData(1);
  });

  searchButton.addEventListener("click", function () {
    if (searchInput.value.trim() === "") {
      alert("검색어를 입력하세요.");
    } else {
      const searchParam = '&' + encodeURIComponent('faclNm') + '=' + encodeURIComponent(searchInput.value.trim());
      fetchXmlData(1, searchParam);
    }
  });
});

const SERVICE_KEY =
  "QkA6saf5BRmu0WE5b0JI2PRxwJh6rDL2x2qibXZxGgYPZMQ2pjhkA8IUU4lAYDJTKDd3oHB2FE3elagtrypoeg==";
const itemsPerPage = 10;
let currentPage = 1;
let totalItems = 0;
let faclTyCd = "";
let previousInfowindow = null;
let markerClusterer;

const mapContainer = document.getElementById("map");
const mapOption = {
  center: new kakao.maps.LatLng(37.5665, 126.978),
  level: 7,
};
const map = new kakao.maps.Map(mapContainer, mapOption);
const geocoder = new kakao.maps.services.Geocoder();
markerClusterer = new kakao.maps.MarkerClusterer({
  map: map,
  averageCenter: true,
  minLevel: 10,
});

const faclTypeIdList = [
  "UC0H03,UC0A10,UC0A15,UC0F03,UC0H05,UC0A12,UC0A06,UC0H02,UC0H04",
  "UC0H01,UC0G02,UC0G03,UC0G08,UC0G01,UC0U04,UC0G05,UC0G06,UC0G07,UC0J02",
  "UC0A05,UC0K02,UC0K03,UC0O02,UC0A03,UC0A04,UC0A07,UC0A08,UC0A09,UC0A11,UC0R01,UC0K01,UC0K05,UC0K04,UC0K06",
  "UC0F01,UC0F02",
  "UC0A01,UC0B01,UC0C02,UC0N01,UC0B03,UC0F02,UC0N02,UC0L01,UC0L02,UC0O01,UC0B02,UC0C01,UC0C04,UC0C05,UC0N01,UC0A02,UC0U01,UC0U03,UC0A13,UC0E01",
];

function applyFilter() {
  faclTyCd = Array.from({ length: 5 }, (_, i) =>
    document.getElementById("faclTyCd" + (i + 1)).checked
      ? faclTypeIdList[i]
      : ""
  )
    .filter(Boolean)
    .join(",");
  fetchXmlData(1);
}

function displayMarker(lat, lng, name, address, status, convenienceInfo) {
  const coords = new kakao.maps.LatLng(lat, lng);
  const marker = new kakao.maps.Marker({ position: coords });

  kakao.maps.event.addListener(marker, "click", () => {
    // 이전에 열려있는 인포윈도우가 있으면 닫기
    if (previousInfowindow) {
      previousInfowindow.close();
    }

    const infowindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;">
                  <strong>${name}</strong><br>
                  주소: ${address}<br>
                  상태: ${status}<br>
                  편의시설: ${convenienceInfo}<br><br>
                </div>`,
    });

    // 새로운 인포윈도우 열기
    infowindow.open(map, marker);

    // 열린 인포윈도우를 이전에 열린 인포윈도우로 설정
    previousInfowindow = infowindow;
  });

  markerClusterer.addMarker(marker);
}

function getAdminDistrictInfo() {
  return new Promise((resolve, reject) => {
    const center = map.getCenter();
    geocoder.coord2RegionCode(
      center.getLng(),
      center.getLat(),
      (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          const adminDistrictInfo =
            result
              .find((r) => r.region_type === "H")
              ?.address_name.split(" ") || null;
          resolve(adminDistrictInfo);
        } else {
          reject("행정동 정보를 가져오는 데 실패했습니다.");
        }
      }
    );
  });
}

async function fetchXmlData(page, searchParam = '') {
  try {
    const adminDistrictArray = await getAdminDistrictInfo();
    if (!adminDistrictArray)
      throw new Error("행정동 정보를 가져오는 데 실패했습니다.");

    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: page,
      numOfRows: itemsPerPage,
      siDoNm: adminDistrictArray[0],
      cggNm: adminDistrictArray[1],
      faclTyCd: faclTyCd || faclTypeIdList.join(","),
    });

    const response = await fetch(
      `http://apis.data.go.kr/B554287/DisabledPersonConvenientFacility/getDisConvFaclList?${queryParams}${searchParam}`
    );
    const xmlData = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlData, "application/xml");
    displayItems(xmlDoc);
  } catch (error) {
    console.error(error);
  }
}

function displayItems(xmlDoc) {
  const items = Array.from(xmlDoc.getElementsByTagName("servList"));
  const container = document.getElementById("itemContainer");
  container.innerHTML = `총 <strong>${
    xmlDoc.getElementsByTagName("totalCount")[0].textContent
  }</strong>건 검색되었습니다.<br><br>`;

  markerClusterer.clear();

  items.forEach((item) => {
    const faclNm = item.getElementsByTagName("faclNm")[0].textContent;
    const lcMnad = item.getElementsByTagName("lcMnad")[0].textContent;
    const salStaNm = item.getElementsByTagName("salStaNm")[0].textContent;
    const faclLat = parseFloat(
      item.getElementsByTagName("faclLat")[0].textContent
    );
    const faclLng = parseFloat(
      item.getElementsByTagName("faclLng")[0].textContent
    );
    const wfcltId = item.getElementsByTagName("wfcltId")[0].textContent; // 여기서 wfcltId 가져오기

    // wfcltId를 사용하여 새로운 API 호출
    fetchEvalInfo(wfcltId)
      .then((evalInfo) => {
        // evalInfo에서 편의시설 정보 추출하여 표시
        const convenienceInfo =
          evalInfo.getElementsByTagName("evalInfo")[0].textContent;
        const div = document.createElement("div");
        div.innerHTML = `<strong>${faclNm}</strong><br>주소: ${lcMnad}<br>상태: ${salStaNm}<br>편의시설: ${convenienceInfo}<br><br>`;
        container.appendChild(div);

        // displayMarker 함수 호출
        displayMarker(
          faclLat,
          faclLng,
          faclNm,
          lcMnad,
          salStaNm,
          convenienceInfo
        );
      })
      .catch((error) => {
        console.error("편의시설 정보 없음", error);
      });
  });

  totalItems = parseInt(
    xmlDoc.getElementsByTagName("totalCount")[0].textContent
  );
  updateButtons();
}

function fetchEvalInfo(wfcltId) {
  const queryParams = new URLSearchParams({
    serviceKey: SERVICE_KEY,
    wfcltId: wfcltId,
  });

  return fetch(
    `http://apis.data.go.kr/B554287/DisabledPersonConvenientFacility/getFacInfoOpenApiJpEvalInfoList?${queryParams}`
  )
    .then((response) => response.text())
    .then((text) => new window.DOMParser().parseFromString(text, "text/xml"));
}

function updateButtons() {
  const paginationButtons = document.getElementById("paginationButtons");
  paginationButtons.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(startPage + 4, totalPages);

  const createButton = (text, disabled, action) => {
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (disabled) li.classList.add("disabled");

    const button = document.createElement("button");
    button.classList.add("page-link");
    button.textContent = text;
    button.disabled = disabled;
    button.onclick = () => {
      action();
      fetchXmlData(currentPage);
    };

    li.appendChild(button);
    return li;
  };

  const buttons = [
    {
      text: "<<",
      disabled: currentPage === 1,
      action: () => (currentPage = 1),
    },
    { text: "<", disabled: currentPage === 1, action: () => currentPage-- },
  ];

  for (let i = startPage; i <= endPage; i++) {
    buttons.push({
      text: i,
      disabled: i === currentPage,
      action: () => (currentPage = i),
    });
  }

  buttons.push(
    {
      text: ">",
      disabled: currentPage === totalPages,
      action: () => currentPage++,
    },
    {
      text: ">>",
      disabled: currentPage === totalPages,
      action: () => (currentPage = totalPages),
    }
  );

  const ul = document.createElement("ul");
  ul.classList.add("pagination");
  buttons.forEach(({ text, disabled, action }) =>
    ul.appendChild(createButton(text, disabled, action))
  );
  paginationButtons.appendChild(ul);
}

// document.addEventListener("DOMContentLoaded", () => fetchXmlData(currentPage));

// 내 위치로 지도 이동
function moveToCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = new kakao.maps.LatLng(lat, lng);
        map.setCenter(coords);

        // 현재 위치 마커 추가
        const currentLocationMarker = new kakao.maps.Marker({
          position: coords,
          map: map,
        });
        markerClusterer.addMarker(currentLocationMarker);
      },
      (error) => {
        console.error("현재 위치를 가져오는 데 실패했습니다.", error);
      }
    );
  } else {
    alert("현재 위치를 가져올 수 없는 브라우저입니다.");
  }
}
