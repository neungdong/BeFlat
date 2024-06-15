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
      fetchXmlData();
    });
  
    searchButton.addEventListener("click", function () {
      if (searchInput.value.trim() === "") {
        alert("검색어를 입력하세요.");
      } else {
        const searchParam = '&' + encodeURIComponent('faclNm') + '=' + encodeURIComponent(searchInput.value.trim());
        fetchXmlData(searchParam);
      }
    });

    // 라디오 버튼 클릭 이벤트 추가
    document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
      radio.addEventListener('click', function() {
        // 클릭한 항목이 체크되어 경우 해제하고 필터 초기화
          if (this.previousChecked) {
              this.checked = false;
              resetFilters();
          }
          this.previousChecked = this.checked;
          quickBtn();
      });
    });
  });
  
  const SERVICE_KEY =
    "QkA6saf5BRmu0WE5b0JI2PRxwJh6rDL2x2qibXZxGgYPZMQ2pjhkA8IUU4lAYDJTKDd3oHB2FE3elagtrypoeg==";
  const itemsPerPage = 1000;
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
  
  //복지시설, 보육/교육시설, 공공기관, 의료기관, 편의시설
  //일반음식점, 휴게음식점/제과점
  const faclTypeIdList = [
    "UC0H03,UC0H02,UC0H04,UC0H05",
    "UC0H01,UC0G02,UC0G03,UC0G04,UC0G05,UC0G06,UC0G07,UC0G01,UC0G08,UC0A15",
    "UC0A05,UC0A03,UC0A04,UC0A06,UC0A07,UC0A08,UC0A09,UC0A10,UC0A11,UC0A12,UC0A13,UC0K01,UC0K02,UC0K03,UC0K04,UC0K05,UC0K06,UC0O01,UC0O02",
    "UC0F01,UC0F02,UC0F03,UC0A14,UC0S01",
    "UC0A01,UC0A02,UC0B01,UC0B02,UC0B03,UC0C01,UC0C02,UC0C03,UC0C04,UC0C05,UC0D01,UC0E01,UC0I01,UC0I02,UC0J01,UC0J02,UC0L01,UC0L02,UC0M01,UC0N01,UC0N02,UC0P01,UC0Q01,UC0Q02,UC0R01,UC0R02,UC0T01,UC0T02,UC0U01,UC0U02,UC0U03,UC0U04,UC0V01",
    "UC0B01",
    "UC0B02",
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
  
  function getSelectedFaclTypes() {
    faclTyCd = Array.from({ length: 7 }, (_, i) =>
      document.getElementById("faclTyCd" + (i + 1)).checked ? faclTypeIdList[i] : "").filter(Boolean).join(",");
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
  
  async function fetchXmlData(searchParam = '') {
    try {
      const adminDistrictArray = await getAdminDistrictInfo();
      if (!adminDistrictArray)
        throw new Error("행정동 정보를 가져오는 데 실패했습니다.");

      getSelectedFaclTypes();
      const selectedTypes = getSelectedConvTypes();
      const queryParams = new URLSearchParams({
        serviceKey: SERVICE_KEY,
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
  
  function displayItems(xmlDoc, selectedTypes) {
    const items = Array.from(xmlDoc.getElementsByTagName("servList"));
    const container = document.getElementById("itemContainer");
    const countContainer = document.getElementById("totalCount");
    container.innerHTML = "";
    countContainer.innerHTML = `총 <strong>${xmlDoc.getElementsByTagName("totalCount")[0].textContent}</strong>건 검색되었습니다.<br><br>`;

    var filteredItemCount = 0;
  
    markerClusterer.clear();
  
    items.forEach((item) => {
      const faclNm = item.getElementsByTagName("faclNm")[0].textContent;
      const lcMnad = item.getElementsByTagName("lcMnad")[0].textContent;
      const faclLat = parseFloat(item.getElementsByTagName("faclLat")[0].textContent);
      const faclLng = parseFloat(item.getElementsByTagName("faclLng")[0].textContent);
      const wfcltId = item.getElementsByTagName("wfcltId")[0].textContent;
  
      // wfcltId를 사용하여 편의시설목록조회 API 호출
      fetchEvalInfo(wfcltId)
        .then((evalInfo) => {
            const convenienceInfo = evalInfo.getElementsByTagName("evalInfo")[0].textContent;

            // 필터링 조건 추가
            const hasSelectedType = selectedTypes.every((type) =>
              convenienceInfo.includes(type)
            );
    
            if (!hasSelectedType && selectedTypes.length > 0) return;
    
            const div = document.createElement("div");
            div.innerHTML = `<strong>${faclNm}</strong><br>주소: ${lcMnad}<br>편의시설: ${convenienceInfo}<br><br>`;
            container.appendChild(div);
    
            displayMarker(faclLat, faclLng, faclNm, lcMnad, convenienceInfo);

            filteredItemCount++;
            countContainer.innerHTML = `총 <strong>${filteredItemCount}</strong>건 검색되었습니다.<br><br>`;
          })
          .catch((error) => {
            console.error("편의시설 정보 없음", error);
          });
    });
    if(selectedTypes.length > 0 && filteredItemCount == 0){
      countContainer.innerHTML = `총 <strong>${filteredItemCount}</strong>건 검색되었습니다.<br><br>`;
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

  function displayMarker(lat, lng, name, address, convenienceInfo) {
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

  function resetFilters() {
    document.querySelectorAll('#offcanvasFilters input[type="checkbox"]').forEach(function(checkbox) {
        checkbox.checked = false;
    });
  }

  function quickBtn(){
    for (let i = 1; i <= 5; i++) {
      const checkbox = document.getElementById(`qbtn${i}`);
      if (checkbox.checked) {
        resetFilters();
        switch(i){
          case 1: // 음식점
            (document.getElementById("faclTyCd6")).checked = true;
            break;
          case 2: // 카페/빵집
            (document.getElementById("faclTyCd7")).checked = true;
            break;
          case 3: // 장애인 주차장
            (document.getElementById("convTy4")).checked = true;
            break;
          case 4: // 장애인 화장실
            (document.getElementById("convTy5")).checked = true;
            break;
          case 5: // 승강기
            (document.getElementById("convTy3")).checked = true;
            break;
        }
        fetchXmlData();
      }
    }
  }
