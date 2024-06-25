document.addEventListener("DOMContentLoaded", function () {
  const bottomSheet = document.getElementById("bottomSheet");
  const bottomSheetHandle = document.getElementById("bottomSheetHandle");
  const locationButton = document.getElementById("locationButton");
  const searchButton = document.getElementById("searchButton");
  const searchInput = document.getElementById("searchInput");
  const filterApplyButton = document.getElementById("filterApplyButton");
  const offcanvasFilters = new bootstrap.Offcanvas(
    document.getElementById("offcanvasFilters")
  );

  if (filterApplyButton) {
    filterApplyButton.addEventListener("click", function () {
      applyFilter();
      offcanvasFilters.hide(); // 사이드바 닫기
    });
  }

  bottomSheetHandle.addEventListener("click", function () {
    bottomSheet.classList.toggle("show");
  });

  locationButton.addEventListener("click", function () {
    moveToCurrentLocation();
  });

  searchButton.addEventListener("click", function () {
    if (searchInput.value.trim() === "") {
      alert("검색어를 입력하세요.");
    } else {
      const searchParam =
        "&" +
        encodeURIComponent("faclNm") +
        "=" +
        encodeURIComponent(searchInput.value.trim());
      fetchXmlData(searchParam);
      bottomSheet.classList.add("show"); // 바텀시트 자동으로 한 칸 올리기
    }
  });

  // 라디오 버튼 클릭 이벤트 추가
  document.querySelectorAll('input[type="radio"]').forEach(function (radio) {
    radio.addEventListener("click", function () {
      // 클릭한 항목이 체크되어 경우 해제하고 필터 초기화
      if (this.previousChecked) {
        this.checked = false;
        resetFilters();
      }
      this.previousChecked = this.checked;
      quickBtn();
    });
  });

  // 리스트 클릭 시 바텀시트 닫기
  document
    .getElementById("itemContainer")
    .addEventListener("click", function (event) {
      if (event.target.closest(".result-item")) {
        bottomSheet.classList.remove("show");
      }
    });
});

// 상수
const SERVICE_KEY =
  "QkA6saf5BRmu0WE5b0JI2PRxwJh6rDL2x2qibXZxGgYPZMQ2pjhkA8IUU4lAYDJTKDd3oHB2FE3elagtrypoeg==";
const itemsPerPage = 1000;
let faclTyCd = "";
let previousInfowindow = null;

// 함수 정의
function applyFilter() {
  fetchXmlData();
  document.getElementById("bottomSheet").classList.add("show"); // 바텀시트 자동으로 한 칸 올리기
}

function getSelectedFaclTypes(length) {
  const startIndex = 1;
  faclTyCd = Array.from({ length }, (_, i) =>
    document.getElementById("faclTyCd" + (i + startIndex)).checked
      ? faclTypeIdList[i]
      : ""
  )
    .filter(Boolean)
    .join(",");
}

function getSelectedConvTypes() {
  const selectedTypes = [];
  for (let i = 1; i <= 8; i++) {
    const checkbox = document.getElementById(`convTy${i}`);
    if (checkbox.checked) {
      selectedTypes.push(...convenienceTypeKeywords[`convTy${i}`]);
    }
  }
  return selectedTypes;
}

async function fetchXmlData(searchParam = "") {
  try {
    const adminDistrictArray = await getAdminDistrictInfo();
    if (!adminDistrictArray)
      throw new Error("행정동 정보를 가져오는 데 실패했습니다.");

    getSelectedFaclTypes(7);
    const selectedTypes = getSelectedConvTypes(7);
    const queryParams = new URLSearchParams({
      serviceKey: SERVICE_KEY,
      pageNo: 1,
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

    displayItems(xmlDoc, selectedTypes);
  } catch (error) {
    console.error(error);
  }
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

let previousCustomOverlay = null;

function displayItems(xmlDoc, selectedTypes) {
  const items = Array.from(xmlDoc.getElementsByTagName("servList"));
  const container = document.getElementById("itemContainer");
  const countContainer = document.getElementById("totalCount");
  container.innerHTML = "";
  countContainer.innerHTML = `총 <strong>${
    xmlDoc.getElementsByTagName("totalCount")[0].textContent
  }</strong>건 검색되었습니다.<br><br>`;

  let filteredItemCount = 0;
  markerClusterer.clear();

  // 모든 비동기 fetchEvalInfo 호출을 추적하기 위한 배열
  const fetchPromises = items.map((item) => {
    const faclNm = item.getElementsByTagName("faclNm")[0].textContent;
    const lcMnad = item.getElementsByTagName("lcMnad")[0].textContent;
    const faclLat = parseFloat(
      item.getElementsByTagName("faclLat")[0].textContent
    );
    const faclLng = parseFloat(
      item.getElementsByTagName("faclLng")[0].textContent
    );
    const wfcltId = item.getElementsByTagName("wfcltId")[0].textContent;
    const faclTyCd = item.getElementsByTagName("faclTyCd")[0].textContent; // 시설 유형 코드 가져오기

    return fetchEvalInfo(wfcltId)
      .then((evalInfo) => {
        const convenienceInfo =
          evalInfo.getElementsByTagName("evalInfo")[0].textContent;

        const hasSelectedType = selectedTypes.every((type) =>
          convenienceInfo.includes(type)
        );

        if (!hasSelectedType && selectedTypes.length > 0) return;

        const div = document.createElement("div");
        div.className = "result-item";
        let iconHtml = "";
        for (const [key, value] of Object.entries(convenienceIcons)) {
          if (convenienceInfo.includes(key)) {
            const displayName = convenienceTypeDisplayNames[key] || key;
            iconHtml += `
        <div class="icon-wrapper">
          <img src="${value}" alt="${key}" class="convenience-icon"> 
          <span class="icon-label">${displayName}</span>
        </div>`;
          }
        }

        div.innerHTML = `
            <div class="result-text">
              <strong style="font-size: 20px; font-weight: bold;">${faclNm}</strong>
              <span class="material-icons detail-button">chevron_right</span>
              <br><span class="lighter-text">${lcMnad}</span>
              <br>${iconHtml}
            </div>`;

        div.style.cursor = "pointer";
        div.addEventListener("click", function () {
          map.setCenter(new kakao.maps.LatLng(faclLat, faclLng));
          map.setLevel(3);
          bottomSheet.classList.remove("show");
        });
        container.appendChild(div);

        displayMarker(
          faclLat,
          faclLng,
          faclNm,
          lcMnad,
          convenienceInfo,
          faclTyCd // 전달된 시설 유형 코드
        );

        const detailButton = div.querySelector(".detail-button");
        detailButton.addEventListener("click", function (event) {
          event.stopPropagation();
          navigateToMapAndSearch(faclNm);
        });
        filteredItemCount++;
        countContainer.innerHTML = `총 <strong>${filteredItemCount}</strong>건 검색되었습니다.<br><br>`;
      })
      .catch((error) => {
        console.error("편의시설 정보 없음", error);
      });
  });

  // 모든 fetchEvalInfo 호출이 완료된 후에 실행
  Promise.all(fetchPromises).then(() => {
    if (selectedTypes.length > 0 && filteredItemCount === 0) {
      container.innerHTML =
        "<div class='no-results-message'>선택한 조건에 해당하는 편의시설이 없습니다.</div>";
    }
  });
}

function resetFilters() {
  document
    .querySelectorAll('#offcanvasFilters input[type="checkbox"]')
    .forEach(function (checkbox) {
      checkbox.checked = false;
    });
}

function quickBtn() {
  for (let i = 1; i <= 5; i++) {
    const checkbox = document.getElementById(`qbtn${i}`);
    if (checkbox.checked) {
      resetFilters();
      switch (i) {
        case 1: // 음식점
          document.getElementById("faclTyCd6").checked = true;
          break;
        case 2: // 카페/빵집
          document.getElementById("faclTyCd7").checked = true;
          break;
        case 3: // 장애인 주차장
          document.getElementById("convTy4").checked = true;
          break;
        case 4: // 장애인 화장실
          document.getElementById("convTy5").checked = true;
          break;
        case 5: // 승강기
          document.getElementById("convTy3").checked = true;
          break;
      }
      fetchXmlData();
      document.getElementById("bottomSheet").classList.add("show"); // 바텀시트 자동으로 한 칸 올리기
    }
  }
}

function filterUpdateFaclType() {
  applyFilter();
}

document
  .getElementById("locationButton")
  .addEventListener("click", moveToCurrentLocation);
