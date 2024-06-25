let markerClusterer;

const mapContainer = document.getElementById("map");
const mapOption = {
  center: new kakao.maps.LatLng(37.5665, 126.978),
  level: 6,
};
const map = new kakao.maps.Map(mapContainer, mapOption);
const geocoder = new kakao.maps.services.Geocoder();
markerClusterer = new kakao.maps.MarkerClusterer({
  map: map,
  averageCenter: true,
  minLevel: 10,
});

function displayMarker(lat, lng, name, address, convenienceInfo, faclTyCd) {
  const coords = new kakao.maps.LatLng(lat, lng);

  let markerImageSrc = "../assets/default.png";

  // 시설 유형 코드에 따라 마커 이미지 설정
  for (const [key, value] of Object.entries(faclTypeIdList_Marker)) {
    if (key.includes(faclTyCd)) {
      markerImageSrc = markerImages[value];
      break;
    }
  }

  const markerImage = new kakao.maps.MarkerImage(
    markerImageSrc,
    new kakao.maps.Size(32, 34),
    { offset: new kakao.maps.Point(16, 34) }
  );

  const marker = new kakao.maps.Marker({
    position: coords,
    image: markerImage,
  });

  kakao.maps.event.addListener(marker, "click", () => {
    if (previousCustomOverlay) {
      previousCustomOverlay.setMap(null);
    }

    const convenienceIconsHtml = convenienceInfo
      .split(",")
      .map((info) => {
        const trimmedInfo = info.trim();
        const iconSrc = convenienceIcons[trimmedInfo];
        const displayName =
          convenienceTypeDisplayNames[trimmedInfo] || trimmedInfo;
        return iconSrc
          ? `<div class="icon-wrapper"><img src="${iconSrc}" class="convenience-icon" alt="${trimmedInfo}"><span class="icon-label">${displayName}</span></div>`
          : "";
      })
      .join("");

    const customOverlayContent = document.createElement("div");
    customOverlayContent.classList.add("customoverlay");

    const link = document.createElement("a");
    link.href = "javascript:void(0);";
    link.target = "_blank";

    const title = document.createElement("span");
    title.classList.add("title");
    title.textContent = name;

    link.appendChild(title);

    const innerDiv = document.createElement("div");
    innerDiv.classList.add("inner-div");
    innerDiv.innerHTML = convenienceIconsHtml;

    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close-button");
    closeBtn.innerHTML = '<span class="icon-close"></span>';
    closeBtn.addEventListener("click", () => {
      customOverlay.setMap(null);
      previousCustomOverlay = null;
    });

    customOverlayContent.appendChild(link);
    customOverlayContent.appendChild(innerDiv);
    customOverlayContent.appendChild(closeBtn);

    const customOverlay = new kakao.maps.CustomOverlay({
      position: coords,
      content: customOverlayContent,
      xAnchor: 0.5,
      yAnchor: 1.0,
    });

    customOverlay.setMap(map);
    previousCustomOverlay = customOverlay;
  });

  markerClusterer.addMarker(marker);
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

function navigateToMapAndSearch(name) {
  const query = encodeURIComponent(name);
  const url = `https://map.kakao.com/link/search/${query}`;
  window.open(url, "_blank");
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
