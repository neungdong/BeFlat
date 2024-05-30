// 공공데이터 KEY
const SERVICE_KEY = "QkA6saf5BRmu0WE5b0JI2PRxwJh6rDL2x2qibXZxGgYPZMQ2pjhkA8IUU4lAYDJTKDd3oHB2FE3elagtrypoeg==";

// 카카오맵 api 초기화 및 지도 설정
var mapContainer = document.getElementById('map'); // 지도를 표시할 div
var mapOption = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울의 대략적인 중심 좌표
    level: 7
};

// 지도 생성
var map = new kakao.maps.Map(mapContainer, mapOption);

// geocoder 객체 생성
var geocoder = new kakao.maps.services.Geocoder();

// 시설 유형 ID
var faclTyCd = '';

function filterUpdateFaclType() {
    // 시설 코드 list
    const welfareList = 'UC0H03,UC0A10,UC0A15,UC0F03,UC0H05,UC0A12,UC0A06,UC0H02,UC0H04';
    const eduList = 'UC0H01,UC0G02,UC0G03,UC0G08,UC0G01,UC0U04,UC0G05,UC0G06,UC0G07,UC0J02';
    const publicList = 'UC0A05,UC0K02,UC0K03,UC0O02,UC0A03,UC0A04,UC0A07,UC0A08,UC0A09,UC0A11,UC0R01,UC0K01,UC0K05,UC0K04,UC0K06';
    const medicalList = 'UC0F01,UC0F02';
    const convenienceList = 'UC0A01,UC0B01,UC0C02,UC0N01,UC0B03,UC0F02,UC0N02,UC0L01,UC0L02,UC0O01,UC0B02,UC0C01,UC0C04,UC0C05,UC0N01,UC0A02,UC0U01,UC0U03,UC0A13,UC0E01';
    var faclTypeIdList = [welfareList, eduList, publicList, medicalList, convenienceList];

    // 시설 유형 ID 초기화
    faclTyCd = '';
    var faclType = [];
    for (var i = 1; i <= 5; i++) {
        var checkbox = document.getElementById('faclTyCd' + i);
        if (checkbox.checked) {
            faclType.push(faclTypeIdList[i-1]);
        }
    }
    faclTyCd = faclType.join(',');
    console.log(faclTyCd); // 디버그용 콘솔 출력

    fetchXmlData(1);
}

function displayMarker(lat, lng, name) {
    var coords = new kakao.maps.LatLng(lat, lng);
    var marker = new kakao.maps.Marker({
        map: map,
        position: coords
    });

    var infowindow = new kakao.maps.InfoWindow({
        content: '<div style="padding:5px;font-size:12px;">' + name + '</div>'
    });
    kakao.maps.event.addListener(marker, 'mouseover', function() {
        infowindow.open(map, marker);
    });
    kakao.maps.event.addListener(marker, 'mouseout', function() {
        infowindow.close();
    });

    map.setCenter(coords);
}

function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar.style.display === "block") {
        sidebar.style.display = "none";
    } else {
        sidebar.style.display = "block";
    }
}

// 현재 지도의 중심 좌표를 이용하여 행정동 정보를 가져오고 공백으로 나누어 반환하는 함수
function getAdminDistrictInfo(callback) {
    var center = map.getCenter(); // 지도의 중심 좌표를 가져옵니다.

    geocoder.coord2RegionCode(center.getLng(), center.getLat(), function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            var adminDistrictInfo = '';
            for (var i = 0; i < result.length; i++) {
                // 행정동 정보가 있는지 확인합니다.
                if (result[i].region_type === 'H') {
                    adminDistrictInfo = result[i].address_name; // 행정동 정보를 가져와 변수에 저장합니다.
                    break;
                }
            }

            // 행정동 정보를 공백으로 나누어 배열에 저장합니다.
            var adminDistrictArray = adminDistrictInfo.split(' ');
            // 콜백 함수를 호출하여 결과를 전달합니다.
            callback(adminDistrictArray);
        } else {
            console.error('행정동 정보를 가져오는 데 실패했습니다.');
            // 실패할 경우 null을 전달합니다.
            callback(null);
        }
    });
}

// paginaition 구현
const itemsPerPage = 10;
let currentPage = 1;
let totalItems = 0;

function fetchXmlData(page) {
    const xhr = new XMLHttpRequest();
    const url = 'http://apis.data.go.kr/B554287/DisabledPersonConvenientFacility/getDisConvFaclList';
    let queryParams = '?' + encodeURIComponent('serviceKey') + '=' + SERVICE_KEY;
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent(page);
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent(itemsPerPage);

    // getAdminDistrictInfo를 Promise로 감싸기
    function getAdminDistrictInfoPromise() {
        return new Promise((resolve, reject) => {
            getAdminDistrictInfo(function(adminDistrictArray) {
                if (adminDistrictArray !== null) {
                    resolve(adminDistrictArray);
                } else {
                    reject('행정동 정보를 가져오는 데 실패했습니다.');
                }
            });
        });
    }

    // Promise 사용
    getAdminDistrictInfoPromise()
        .then(adminDistrictArray => {
            console.log('행정동 정보:', adminDistrictArray);
            queryParams += '&' + encodeURIComponent('siDoNm') + '=' + encodeURIComponent(adminDistrictArray[0]); // 시도명
            queryParams += '&' + encodeURIComponent('cggNm') + '=' + encodeURIComponent(adminDistrictArray[1]); // 시군구
                        
            if(faclTyCd != '') queryParams += '&' + encodeURIComponent('faclTyCd') + '=' + encodeURIComponent(faclTyCd);

            xhr.open('GET', url + queryParams);
            xhr.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    displayItems(this.responseXML);
                }
            };
            xhr.send();
        })
        .catch(error => {
            console.error(error);
        });
}

function displayItems(xmlDoc) {
    const totalCount = xmlDoc.getElementsByTagName("totalCount")[0].textContent;
    const items = xmlDoc.getElementsByTagName("servList");
    const container = document.getElementById("itemContainer");
    container.innerHTML = "";

    const totalNum = document.createElement("div");
    totalNum.innerHTML = `총 <strong>${totalCount}</strong>건 검색되었습니다.<br><br>`;
    container.appendChild(totalNum);

    for (let i = 0; i < items.length; i++) {
        const faclNm = items[i].getElementsByTagName("faclNm")[0].textContent;
        const lcMnad = items[i].getElementsByTagName("lcMnad")[0].textContent;
        const salStaNm = items[i].getElementsByTagName("salStaNm")[0].textContent;
        const faclLat = parseFloat(items[i].getElementsByTagName("faclLat")[0].textContent);
        const faclLng = parseFloat(items[i].getElementsByTagName("faclLng")[0].textContent);

        const div = document.createElement("div");
        div.innerHTML = `<strong>${faclNm}</strong><br>
                            주소: ${lcMnad}<br>
                            상태: ${salStaNm}<br><br>`;
        container.appendChild(div);

        // 위도, 경도를 사용하여 지도에 마커를 표시합니다.
        displayMarker(faclLat, faclLng, faclNm);
    }

    totalItems = parseInt(xmlDoc.getElementsByTagName("totalCount")[0].textContent);
    updateButtons();
}

function updateButtons() {
    const paginationButtons = document.getElementById("paginationButtons");
    paginationButtons.innerHTML = "";

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(startPage + 4, totalPages);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    // '<<' 버튼 추가
    const firstPageButton = document.createElement("button");
    firstPageButton.textContent = "<<";
    firstPageButton.disabled = currentPage === 1;
    firstPageButton.onclick = function () {
        currentPage = 1;
        fetchXmlData(currentPage);
    };
    paginationButtons.appendChild(firstPageButton);

    // '<' 버튼 추가
    const prevPageButton = document.createElement("button");
    prevPageButton.textContent = "<";
    prevPageButton.disabled = currentPage === 1;
    prevPageButton.onclick = function () {
        if (currentPage > 1) {
            currentPage--;
            fetchXmlData(currentPage);
        }
    };
    paginationButtons.appendChild(prevPageButton);

    // 숫자 버튼 추가
    for (let i = startPage; i <= endPage; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.disabled = i === currentPage;
        button.onclick = function () {
            currentPage = i;
            fetchXmlData(currentPage);
        };
        paginationButtons.appendChild(button);
    }

    // '>' 버튼 추가
    const nextPageButton = document.createElement("button");
    nextPageButton.textContent = ">";
    nextPageButton.disabled = currentPage === totalPages;
    nextPageButton.onclick = function () {
        if (currentPage < totalPages) {
            currentPage++;
            fetchXmlData(currentPage);
        }
    };
    paginationButtons.appendChild(nextPageButton);

    // '>>' 버튼 추가
    const lastPageButton = document.createElement("button");
    lastPageButton.textContent = ">>";
    lastPageButton.disabled = currentPage === totalPages;
    lastPageButton.onclick = function () {
        currentPage = totalPages;
        fetchXmlData(currentPage);
    };
    paginationButtons.appendChild(lastPageButton);
}


function changePage(direction) {
    currentPage += direction;
    fetchXmlData(currentPage);
}

// 초기 데이터 로드
fetchXmlData(currentPage);