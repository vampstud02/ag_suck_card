/**
 * ====================================================================================================
 * Lost Ark 카드 메모리 게임 도우미 스크립트 - 최적화된 버전
 * ====================================================================================================
 * 
 * 핵심 기능만 포함한 정리된 버전
 * 
 * 주요 기능:
 * 1. 실시간 매칭 (단일 게임)
 * 2. 완전 자동화 (연속 게임)
 * 3. 경품 모달 기반 완료 감지
 * 4. 카드 메모리 UI
 */

// ====================================================================================================
// 1. 중복 설치 방지 및 초기화
// ====================================================================================================

function initializeCardMemoHelper() {
    // 이미 설치되어 있는지 확인
    if (window.__cardMemoInstalled) {
        alert("카드 미리보기 스크립트가 이미 설치되어 있습니다.");
        return;
    }

    // 설치 플래그 설정
    window.__cardMemoInstalled = true;

    // 전역 변수 초기화
    window.__cardMemo = window.__cardMemo || {};  // 카드 위치별 이미지 저장소
    window.__cardDone = [];                        // 이미 맞춘 카드 인덱스들

    console.log("카드 메모리 도우미 초기화 완료");
}

// ====================================================================================================
// 2. UI 패널 생성
// ====================================================================================================

function createMainPanel() {
    // 메인 컨테이너 생성
    const container = document.createElement("div");
    container.id = "card-memo-container";

    // 기본 스타일 적용
    applyContainerStyles(container);

    // 이전 위치/크기 복원
    restorePanelPosition(container);

    return container;
}

function applyContainerStyles(container) {
    Object.assign(container.style, {
        position: "fixed",
        right: "12px",
        bottom: "12px",
        zIndex: 2147483647,                    // 최상위 레이어
        background: "rgba(255,255,255,0.95)",  // 반투명 흰색 배경
        border: "1px solid rgba(0,0,0,0.2)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
        fontSize: "12px",
        color: "#111",
        userSelect: "none"                     // 텍스트 선택 방지
    });
}

function restorePanelPosition(container) {
    // 이전 세션에서 저장된 위치/크기 정보 복원
    const savedSettings = sessionStorage.getItem("__cardMemoPanel");
    let panelSettings = { left: null, top: null, scale: 1 };

    if (savedSettings) {
        try {
            panelSettings = JSON.parse(savedSettings);
        } catch (error) {
            console.warn("저장된 패널 설정 파싱 실패:", error);
        }
    }

    // 위치 복원
    if (panelSettings.left !== null && panelSettings.top !== null) {
        container.style.left = panelSettings.left + "px";
        container.style.top = panelSettings.top + "px";
        container.style.right = "auto";
        container.style.bottom = "auto";
    }

    // 크기 복원
    if (panelSettings.scale !== 1) {
        container.style.transform = `scale(${panelSettings.scale})`;
    }

    return panelSettings;
}

// ====================================================================================================
// 3. 헤더 및 컨트롤 버튼 생성
// ====================================================================================================

function createHeader() {
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.marginBottom = "6px";
    header.style.cursor = "move";  // 드래그 가능 표시

    // 제목
    const title = document.createElement("div");
    title.textContent = "카드 메모리 게임";
    title.style.fontWeight = "600";
    title.style.marginRight = "8px";

    // 버튼 컨테이너
    const buttonContainer = document.createElement("div");

    // 실시간 매칭 버튼
    const autoClickButton = createAutoClickButton();

    // 디버그 버튼
    const debugButton = createDebugButton();

    // 초기화 버튼
    const resetButton = createResetButton();

    // 닫기 버튼
    const closeButton = createCloseButton();

    buttonContainer.appendChild(autoClickButton);
    buttonContainer.appendChild(debugButton);
    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    return header;
}

function createAutoClickButton() {
    const button = document.createElement("button");
    button.textContent = "실시간 매칭";
    button.title = "실시간 매칭 시스템으로 1회 게임 플레이";

    Object.assign(button.style, {
        padding: "4px 6px",
        fontSize: "11px",
        cursor: "pointer",
        marginLeft: "6px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "3px"
    });

    // 클릭 이벤트: 실시간 매칭 시스템 시작
    button.addEventListener("click", () => {
        startSingleGameMatching();
    });

    return button;
}

function createDebugButton() {
    const button = document.createElement("button");
    button.textContent = "디버그";
    button.title = "게임 구조 분석";

    Object.assign(button.style, {
        padding: "4px 6px",
        fontSize: "11px",
        cursor: "pointer",
        marginLeft: "6px",
        backgroundColor: "#FF9800",
        color: "white",
        border: "none",
        borderRadius: "3px"
    });

    // 클릭 이벤트: 게임 구조 분석
    button.addEventListener("click", () => {
        debugGameStructure();
    });

    return button;
}

function createResetButton() {
    const button = document.createElement("button");
    button.textContent = "초기화";
    button.title = "기억한 카드 초기화";

    Object.assign(button.style, {
        padding: "4px 6px",
        fontSize: "11px",
        cursor: "pointer",
        marginLeft: "6px"
    });

    // 클릭 이벤트: 저장된 카드 정보 완전 삭제 (게임 완료 시와 동일)
    button.addEventListener("click", () => {
        if (confirm("저장된 카드 정보를 모두 삭제하시겠습니까?")) {
            // 게임 완료 시와 동일한 초기화
            window.__cardDone = [];
            window.__cardMemo = {};
            updateCardDisplay();
            console.log("카드 메모리 완전 초기화 완료");
        }
    });

    return button;
}

function createCloseButton() {
    const button = document.createElement("button");
    button.textContent = "×";
    button.title = "닫기 (UI만 숨김)";

    Object.assign(button.style, {
        padding: "2px 6px",
        fontSize: "14px",
        cursor: "pointer",
        marginLeft: "6px"
    });

    // 클릭 이벤트: UI 숨기기 (기능은 계속 동작)
    button.addEventListener("click", () => {
        const container = document.getElementById("card-memo-container");
        if (container) {
            container.style.display = "none";
        }
    });

    return button;
}

// ====================================================================================================
// 4. 카드 그리드 생성 (6x3 = 18칸)
// ====================================================================================================

function createCardGrid() {
    const grid = document.createElement("div");
    grid.id = "card-memo-grid";

    // 그리드 스타일
    Object.assign(grid.style, {
        display: "grid",
        gridTemplateColumns: "repeat(6, 63px)",  // 6열
        gridTemplateRows: "repeat(3, 84px)",     // 3행
        gap: "6px",
        transition: "transform 0.1s",
        transformOrigin: "top left"
    });

    // 18개의 카드 슬롯 생성
    const cardSlots = [];
    for (let i = 0; i < 18; i++) {
        const slot = createCardSlot(i);
        grid.appendChild(slot);
        cardSlots.push(slot);
    }

    return { grid, cardSlots };
}

function createCardSlot(index) {
    const slot = document.createElement("div");
    slot.className = "card-memo-slot";
    slot.dataset.index = String(index);

    // 슬롯 스타일
    Object.assign(slot.style, {
        width: "63px",
        height: "84px",
        border: "1px dashed rgba(0,0,0,0.15)",
        borderRadius: "4px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
        position: "relative",
        cursor: "default"
    });

    // 카드 이미지 요소
    const cardImage = document.createElement("img");
    Object.assign(cardImage.style, {
        maxWidth: "100%",
        maxHeight: "100%",
        display: "none"  // 처음에는 숨김
    });

    slot.appendChild(cardImage);
    return slot;
}

// ====================================================================================================
// 5. 크기 조절 핸들 생성
// ====================================================================================================

function createResizeHandle() {
    const handle = document.createElement("div");

    Object.assign(handle.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "12px",
        height: "12px",
        cursor: "nwse-resize",           // 대각선 크기 조절 커서
        background: "rgba(0,0,0,0.2)",
        borderTopLeftRadius: "8px"
    });

    return handle;
}

// ====================================================================================================
// 6. 카드 표시 업데이트 함수
// ====================================================================================================

function updateCardDisplay() {
    const cardSlots = document.querySelectorAll('.card-memo-slot');

    // 같은 이미지를 가진 카드들을 그룹으로 만들기
    const imageGroups = {};
    const colorPalette = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FF8000', '#8000FF', '#00FF80', '#FF0080'
    ];

    // 카드들을 이미지별로 그룹화
    for (let i = 0; i < 18; i++) {
        if (window.__cardMemo[i] && !window.__cardDone.includes(i)) {
            const imageUrl = window.__cardMemo[i];
            if (!imageGroups[imageUrl]) {
                imageGroups[imageUrl] = [];
            }
            imageGroups[imageUrl].push(i);
        }
    }

    // 2장인 그룹에 색상 할당
    let colorIndex = 0;
    const cardColors = {};
    Object.entries(imageGroups).forEach(([imageUrl, indices]) => {
        if (indices.length === 2) {  // 정확히 2장일 때만
            const color = colorPalette[colorIndex % colorPalette.length];
            indices.forEach(index => {
                cardColors[index] = color;
            });
            colorIndex++;
        }
    });

    for (let i = 0; i < 18; i++) {
        const cardImageUrl = window.__cardMemo[i];  // 저장된 카드 이미지
        const slot = cardSlots[i];
        const image = slot.querySelector('img');

        if (cardImageUrl) {
            // 카드 이미지가 있는 경우
            image.src = cardImageUrl;
            image.style.display = "block";
            slot.style.background = "#fff";
            slot.style.borderStyle = "solid";

            // 이미 맞춘 카드는 회색 처리
            if (window.__cardDone.includes(i)) {
                image.style.filter = "grayscale(100%)";
                image.style.opacity = "0.2";
                slot.style.border = "1px solid #ccc";
                slot.style.boxShadow = "none";
                slot.style.backgroundColor = "#fff";
            } else {
                image.style.removeProperty("filter");
                image.style.removeProperty("opacity");

                // 같은 카드가 있으면 하이라이트
                if (cardColors[i]) {
                    slot.style.border = `3px solid ${cardColors[i]}`;
                    slot.style.boxShadow = `0 0 15px ${cardColors[i]}60`;
                    slot.style.backgroundColor = `${cardColors[i]}20`;
                } else {
                    slot.style.border = "1px solid #ccc";
                    slot.style.boxShadow = "none";
                    slot.style.backgroundColor = "#fff";
                }
            }
        } else {
            // 카드 이미지가 없는 경우
            image.src = "";
            image.style.display = "none";
            slot.style.background = "#fafafa";
            slot.style.borderStyle = "dashed";
            slot.style.border = "1px dashed rgba(0,0,0,0.15)";
            slot.style.boxShadow = "none";
        }
    }
}

// ====================================================================================================
// 7. 드래그 기능 구현
// ====================================================================================================

function setupDragFunctionality(container, header) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    // 드래그 시작
    header.addEventListener("mousedown", (event) => {
        isDragging = true;
        dragOffsetX = event.clientX - container.offsetLeft;
        dragOffsetY = event.clientY - container.offsetTop;
        document.body.style.userSelect = "none";  // 드래그 중 텍스트 선택 방지
    });

    // 드래그 종료
    window.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            // 위치 저장
            savePanelSettings(container);
        }
        document.body.style.userSelect = "";
    });

    // 드래그 중
    window.addEventListener("mousemove", (event) => {
        if (!isDragging) return;

        const newX = event.clientX - dragOffsetX;
        const newY = event.clientY - dragOffsetY;

        container.style.left = newX + "px";
        container.style.top = newY + "px";
        container.style.right = "auto";
        container.style.bottom = "auto";
    });
}

// ====================================================================================================
// 8. 크기 조절 기능 구현
// ====================================================================================================

function setupResizeFunctionality(container, resizeHandle, currentSettings) {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startScale = currentSettings.scale;

    // 크기 조절 시작
    resizeHandle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        isResizing = true;
        startX = event.clientX;
        startY = event.clientY;
        startScale = currentSettings.scale;
    });

    // 크기 조절 종료
    window.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            savePanelSettings(container, currentSettings);
        }
    });

    // 크기 조절 중
    window.addEventListener("mousemove", (event) => {
        if (!isResizing) return;

        // 마우스 이동 거리를 스케일 변화로 변환
        const deltaX = startX - event.clientX;
        const deltaY = startY - event.clientY;
        const scaleDelta = (deltaX + deltaY) / 400;

        // 새로운 스케일 계산 (0.5 ~ 3.0 범위)
        let newScale = Math.min(Math.max(0.5, startScale + scaleDelta), 3);

        currentSettings.scale = newScale;
        container.style.transform = `scale(${newScale})`;
    });
}

// ====================================================================================================
// 9. 네트워크 요청 감지 및 카드 정보 수집
// ====================================================================================================

function interceptNetworkRequests() {
    // XMLHttpRequest를 가로채서 카드 정보 수집
    const originalXHR = window.XMLHttpRequest;

    window.XMLHttpRequest = function CustomXHR() {
        const xhr = new originalXHR();
        let requestUrl = null;
        let requestMethod = null;
        let requestData = null;

        // open 메서드 가로채기
        const originalOpen = xhr.open;
        xhr.open = function (method, url) {
            requestMethod = method;
            requestUrl = url;
            return originalOpen.apply(xhr, arguments);
        };

        // send 메서드 가로채기
        const originalSend = xhr.send;
        xhr.send = function (data) {
            requestData = data;

            // 응답 처리
            xhr.addEventListener("load", function () {
                try {
                    processCardResponse(requestUrl, requestMethod, requestData, xhr.responseText);
                } catch (error) {
                    console.error("카드 응답 처리 중 오류:", error);
                }
            });

            return originalSend.apply(xhr, arguments);
        };

        // 프로토타입 유지
        CustomXHR.prototype = originalXHR.prototype;
        return xhr;
    };
}

function processCardResponse(url, method, requestData, responseText) {
    if (!url) return;

    // 카드 게임 API 요청인지 확인
    const apiUrl = new URL(url, location.href);
    if (!apiUrl.pathname.endsWith("/Promotion/Card/GetCard251105")) return;
    if (!method || method.toUpperCase() !== "POST") return;

    // 요청 데이터에서 카드 인덱스 추출
    let cardIndex = null;
    if (typeof requestData === "string") {
        const match = requestData.match(/(?:^|&)index=([^&]+)/);
        if (match) {
            cardIndex = decodeURIComponent(match[1]);
        }
    } else if (requestData instanceof FormData || requestData instanceof URLSearchParams) {
        cardIndex = requestData.get("index");
    }

    // 응답 데이터 파싱
    if (!responseText) return;

    try {
        const response = JSON.parse(responseText);

        if (response) {
            // 카드 이미지 저장
            if (response.img != null) {
                const index = cardIndex != null ? Number(cardIndex) : null;
                if (index !== null && !Number.isNaN(index) && index >= 0 && index < 18) {
                    // 상대 URL을 절대 URL로 변환
                    window.__cardMemo[index] = new URL(response.img, "https://cdn-lostark.game.onstove.com").href;
                }
            }

            // 매치된 카드들 처리
            if (response.isMatch && response.index) {
                window.__cardDone = [...window.__cardDone, ...response.index];
            }

            // 게임 완료 시 초기화
            if (response.complete) {
                window.__cardDone = [];
                window.__cardMemo = {};
            }
        }

        // UI 업데이트
        updateCardDisplay();

    } catch (error) {
        console.error("카드 응답 파싱 오류:", error);
    }
}

// ====================================================================================================
// 10. 설정 저장 함수
// ====================================================================================================

function savePanelSettings(container, currentSettings = null) {
    const settings = {
        left: container.offsetLeft,
        top: container.offsetTop,
        scale: currentSettings ? currentSettings.scale : 1
    };

    sessionStorage.setItem("__cardMemoPanel", JSON.stringify(settings));
}

// ====================================================================================================
// 11. 실시간 매칭 시스템 (핵심 기능)
// ====================================================================================================
// 11. 실시간 매칭 시스템 (핵심 기능)
// ====================================================================================================

// 단일 게임 실시간 매칭 함수 (우하단 UI 버튼용)
function startSingleGameMatching() {
    console.log("🎯 단일 게임 실시간 매칭 시작!");

    // 게임이 시작되었는지 확인
    const gameStarted = checkIfGameStarted();
    if (!gameStarted) {
        alert("게임이 아직 시작되지 않았습니다.\n\n해결 방법:\n1. 게임 시작 버튼을 먼저 클릭해주세요\n2. 카드들이 화면에 나타난 후 다시 시도해주세요");
        return;
    }

    // 게임 카드 요소들이 있는지 먼저 확인
    const gameCards = findGameCardElements();
    if (!gameCards) {
        alert("게임 카드 요소를 찾을 수 없습니다.\n\n가능한 원인:\n1. 게임이 아직 완전히 로드되지 않음\n2. 게임 구조가 예상과 다름\n\nF12 콘솔을 확인해주세요.");
        return;
    }

    console.log(`🎮 게임 카드 ${gameCards.length}개 발견`);

    // 각 카드 요소의 정보 출력
    gameCards.forEach((card, index) => {
        console.log(`카드 ${index}:`, {
            tagName: card.tagName,
            className: card.className,
            onclick: card.onclick ? 'O' : 'X',
            id: card.id || 'none'
        });
    });

    // 매칭 가능한 카드 쌍 찾기
    const matchingPairs = findMatchingCardPairs();

    if (matchingPairs.length === 0) {
        alert("매칭할 수 있는 카드가 없습니다.\n먼저 수동으로 몇 장의 카드를 클릭해서 정보를 수집해주세요.");
        return;
    }

    console.log(`🎯 ${matchingPairs.length}개의 매칭 가능한 쌍을 발견했습니다:`, matchingPairs);

    // ⚠️ 안전 모드: 자동 클릭 대신 카드 위치만 표시
    const safeMode = confirm(
        `${matchingPairs.length}개의 매칭 가능한 카드 쌍을 발견했습니다!\n\n` +
        `안전 모드 (권장): 카드 위치만 화면에 표시하고 수동으로 클릭\n` +
        `위험 모드: 자동으로 클릭 (게임에서 차단될 수 있음)\n\n` +
        `안전 모드를 사용하시겠습니까?\n` +
        `(확인 = 안전 모드, 취소 = 위험한 자동 클릭)`
    );

    if (safeMode) {
        // 안전 모드: 카드 위치만 하이라이트
        highlightMatchingCards(matchingPairs);
        alert(`💡 안전 모드 활성화!\n\n노란색으로 표시된 카드들을 수동으로 클릭해주세요.\n각 쌍은 같은 색깔로 표시됩니다.`);
    } else {
        // 위험 모드: 완전 자동 게임 플레이
        console.log("⚠️ 위험 모드 선택됨 - 완전 자동 게임 시작!");

        alert(`� 완전 자동 모드 시작!\n\n게임을 처음부터 끝까지 자동으로 진행합니다.\n콘솔에서 진행 상황을 확인하세요.`);

        // 전체 게임 자동 진행
        playGameAutomatically(matchingPairs);
    }
}

// 완전 자동 게임 플레이 (모든 카드 매칭)
function playGameAutomatically(initialMatchingPairs) {
    console.log("🎮 완전 자동 게임 시작!");

    let currentStep = 0;
    let totalMatches = 0;

    function processNextPair() {
        console.log(`\n🔄 자동 게임 단계 ${currentStep + 1} 시작...`);

        // 현재 게임 상태에서 매칭 가능한 카드 다시 검색
        const currentPairs = findMatchingCardPairs();

        if (currentPairs.length === 0) {
            console.log("🎉 게임 완료! 모든 카드가 매칭되었습니다.");

            // 게임 완료 확인
            setTimeout(() => {
                checkGameCompletion();
            }, 2000);
            return;
        }

        console.log(`📊 현재 매칭 가능한 쌍: ${currentPairs.length}개`);

        // 첫 번째 매칭 쌍 선택
        const [index1, index2] = currentPairs[0];
        console.log(`🎯 단계 ${currentStep + 1}: 카드 ${index1} ↔ ${index2} 매칭 시도`);

        // 첫 번째 카드 클릭
        setTimeout(() => {
            console.log(`👆 첫 번째 카드 ${index1} 클릭...`);
            clickGameCardNaturally(index1);

            // 두 번째 카드 클릭 (자연스러운 지연)
            setTimeout(() => {
                console.log(`👆 두 번째 카드 ${index2} 클릭...`);
                clickGameCardNaturally(index2);

                // 매칭 결과 확인 후 다음 단계 진행
                setTimeout(() => {
                    currentStep++;
                    totalMatches++;
                    console.log(`✅ 단계 ${currentStep} 완료! (총 ${totalMatches}쌍 매칭됨)`);

                    // 다음 쌍 처리 (재귀적으로)
                    processNextPair();

                }, 2000 + Math.random() * 1000); // 2-3초 후 다음 단계

            }, 1200 + Math.random() * 800); // 1.2-2초 카드 간 지연

        }, 800 + Math.random() * 400); // 0.8-1.2초 초기 지연
    }

    // 자동 게임 시작
    console.log(`🚀 자동 게임 시작! 총 ${initialMatchingPairs.length}쌍을 매칭할 예정입니다.`);
    processNextPair();
}

// 게임 완료 상태 확인
function checkGameCompletion() {
    console.log("🏁 게임 완료 상태 확인 중...");

    const gameCards = findGameCardElements();
    if (!gameCards) {
        console.log("❌ 게임 카드를 찾을 수 없습니다.");
        return;
    }

    // 모든 카드가 매칭되었는지 확인
    const allMatched = gameCards.every(card => {
        return card.className.includes('is-matched') ||
            card.classList.contains('matched') ||
            card.style.visibility === 'hidden' ||
            card.disabled === true;
    });

    if (allMatched) {
        console.log("🎉🎉🎉 축하합니다! 게임을 완전히 완료했습니다! 🎉🎉🎉");

        // 성공 메시지 표시
        setTimeout(() => {
            alert("🎉 축하합니다!\n\n카드 매칭 게임을 완전히 자동으로 완료했습니다!\n\n🤖 자동화 봇이 모든 카드를 성공적으로 매칭했습니다.");
        }, 1000);

        // 게임 결과 확인 (점수, 시간 등)
        setTimeout(() => {
            checkGameResults();
        }, 3000);

    } else {
        console.log("🔄 아직 매칭되지 않은 카드가 있습니다. 게임을 계속 진행합니다...");

        // 남은 카드 확인 후 추가 처리
        setTimeout(() => {
            const remainingPairs = findMatchingCardPairs();
            if (remainingPairs.length > 0) {
                console.log("🔄 추가 매칭 가능한 카드 발견! 게임 재시작...");
                playGameAutomatically(remainingPairs);
            } else {
                console.log("❓ 더 이상 매칭할 수 있는 카드가 없습니다.");
            }
        }, 2000);
    }
}

// 게임 결과 확인 및 표시
function checkGameResults() {
    console.log("📊 게임 결과 분석 중...");

    // 게임 결과 관련 요소들 찾기
    const possibleResultSelectors = [
        '.game-result',
        '.score',
        '.timer',
        '.completion-time',
        '.game-score',
        '.final-score',
        '#score',
        '#timer',
        '.time',
        '.points'
    ];

    let results = {};

    possibleResultSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            results[selector] = element.textContent || element.innerText;
            console.log(`📈 ${selector}: ${results[selector]}`);
        }
    });

    // 결과가 있으면 표시
    if (Object.keys(results).length > 0) {
        console.log("🏆 게임 결과:", results);

        let resultMessage = "🏆 게임 완료 결과:\n\n";
        Object.entries(results).forEach(([key, value]) => {
            resultMessage += `${key}: ${value}\n`;
        });

        setTimeout(() => {
            alert(resultMessage);
        }, 1000);
    } else {
        console.log("📊 게임 결과 정보를 찾을 수 없습니다.");
    }
}
function highlightMatchingCards(matchingPairs) {
    console.log("🎨 매칭 카드들을 하이라이트 중...");

    const colors = [
        '#FFD700', // 금색
        '#FF6B6B', // 빨강
        '#4ECDC4', // 민트
        '#45B7D1', // 파랑
        '#FFA726', // 주황
        '#AB47BC', // 보라
        '#66BB6A', // 초록
        '#EF5350'  // 진빨강
    ];

    const gameCards = findGameCardElements();
    if (!gameCards) return;

    // 기존 하이라이트 제거
    gameCards.forEach(card => {
        card.style.border = '';
        card.style.boxShadow = '';
        card.style.backgroundColor = '';
    });

    // 매칭 쌍별로 색칠
    matchingPairs.forEach((pair, pairIndex) => {
        const color = colors[pairIndex % colors.length];
        const [index1, index2] = pair;

        if (gameCards[index1] && gameCards[index2]) {
            // 강한 테두리와 그림자로 하이라이트
            [gameCards[index1], gameCards[index2]].forEach(card => {
                card.style.border = `4px solid ${color}`;
                card.style.boxShadow = `0 0 15px ${color}`;
                card.style.backgroundColor = color + '40'; // 투명도 40%
            });

            console.log(`💡 쌍 ${pairIndex + 1}: 카드 ${index1}, ${index2} (${color})`);
        }
    });

    console.log("✅ 하이라이트 완료! 같은 색의 카드들을 클릭하세요.");
}

// 자연스러운 클릭 함수 (게임 차단 최소화)
function clickGameCardNaturally(cardIndexOrElement) {
    let card;
    let cardIndex;

    // 카드 인덱스가 전달된 경우
    if (typeof cardIndexOrElement === 'number') {
        cardIndex = cardIndexOrElement;
        const gameCards = findGameCardElements();
        if (!gameCards || !gameCards[cardIndex]) {
            console.log(`❌ 카드 ${cardIndex}를 찾을 수 없음`);
            return;
        }
        card = gameCards[cardIndex];
    }
    // 카드 요소가 직접 전달된 경우
    else if (cardIndexOrElement && cardIndexOrElement.nodeType === Node.ELEMENT_NODE) {
        card = cardIndexOrElement;
        const gameCards = findGameCardElements();
        cardIndex = gameCards ? Array.from(gameCards).indexOf(card) : -1;
    }
    else {
        console.log('❌ 잘못된 카드 참조');
        return;
    }

    console.log(`🎯 자연스러운 클릭 시작: 카드 ${cardIndex}`);

    // 1단계: 카드 근처로 마우스 이동 시뮬레이션
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 약간의 랜덤 오프셋 (사람처럼 정확하지 않게)
    const offsetX = (Math.random() - 0.5) * 20; // -10px ~ +10px
    const offsetY = (Math.random() - 0.5) * 20;
    const finalX = centerX + offsetX;
    const finalY = centerY + offsetY;

    // 2단계: 마우스 호버 시뮬레이션
    setTimeout(() => {
        console.log(`🖱️ 마우스 호버 시뮬레이션... (${finalX.toFixed(1)}, ${finalY.toFixed(1)})`);

        const hoverEvent = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: finalX,
            clientY: finalY
        });
        card.dispatchEvent(hoverEvent);

        // 3단계: 클릭 시뮬레이션 (사람의 반응시간 후)
        setTimeout(() => {
            console.log(`👆 자연스러운 클릭 실행...`);

            // 가장 안전한 클릭 방법만 사용
            try {
                card.focus(); // 포커스 먼저
                card.click(); // 기본 클릭
                console.log(`✅ 카드 ${cardIndex} 클릭 완료`);
            } catch (e) {
                console.log(`❌ 클릭 실패: ${e.message}`);
            }

        }, 150 + Math.random() * 100); // 사람의 반응시간 (150-250ms)

    }, 100 + Math.random() * 50); // 호버 후 클릭까지의 지연
}

function checkIfGameStarted() {
    console.log("🎮 게임 시작 상태 확인...");

    // 1. 캔버스 요소 확인
    const canvas = document.querySelector('canvas');
    if (canvas) {
        console.log('✅ 캔버스 발견 - 게임이 실행 중일 가능성 높음');
        return true;
    }

    // 2. 게임 컨테이너나 게임 영역 확인
    const gameAreas = document.querySelectorAll('#gameArea, .game-container, .card-container, .game-board, .game-area');
    if (gameAreas.length > 0) {
        console.log('✅ 게임 영역 발견 - 게임이 로드됨');
        return true;
    }

    // 3. 카드 관련 요소들이 있는지 확인
    const cardElements = document.querySelectorAll('.card, .item, .slot, [class*="card"]');
    if (cardElements.length >= 10) {
        console.log('✅ 카드 요소들 발견 - 게임이 시작됨');
        return true;
    }

    // 4. 게임 시작 버튼이 사라졌는지 확인
    const startButton = document.querySelector('button[onclick*="Game.Exec"], .button--gamestart, [onclick*="start"], [onclick*="Start"]');
    if (!startButton || getComputedStyle(startButton).display === 'none') {
        console.log('✅ 게임 시작 버튼이 사라짐 - 게임이 시작됨');
        return true;
    }

    console.log('❌ 게임이 아직 시작되지 않은 것 같습니다');
    console.log('💡 다음을 확인해주세요:');
    console.log('- 게임 시작 버튼을 클릭했는지');
    console.log('- 게임 로딩이 완료되었는지');
    console.log('- 카드들이 화면에 보이는지');

    return false;
}

function findMatchingCardPairs() {
    const pairs = [];
    const imageGroups = {};

    // 저장된 카드들을 이미지별로 그룹화
    for (let i = 0; i < 18; i++) {
        // 이미 맞춘 카드는 제외
        if (window.__cardMemo[i] && !window.__cardDone.includes(i)) {
            const imageUrl = window.__cardMemo[i];
            if (!imageGroups[imageUrl]) {
                imageGroups[imageUrl] = [];
            }
            imageGroups[imageUrl].push(i);
        }
    }

    // 2장인 그룹만 매칭 가능한 쌍으로 추가
    Object.values(imageGroups).forEach(indices => {
        if (indices.length === 2) {
            pairs.push(indices);
        }
    });

    return pairs;
}

function clickGameCard(cardIndex, callback) {
    // 게임 화면에서 실제 카드 요소 찾기
    const gameCards = findGameCardElements();

    if (!gameCards || cardIndex >= gameCards.length) {
        console.error(`❌ 카드 인덱스 ${cardIndex}에 해당하는 게임 카드를 찾을 수 없습니다.`);
        if (callback) callback();
        return;
    }

    const cardElement = gameCards[cardIndex];
    console.log(`🎯 카드 ${cardIndex} 클릭 시도:`, cardElement);

    // 임시로 카드 상태 확인을 건너뛰고 강제 클릭
    console.log('⚠️ 테스트 모드: 카드 상태 확인 건너뛰고 강제 클릭');

    // 카드가 이미 열려있는지 확인 (주석 처리하여 무시)
    /*
    if (isCardAlreadyOpen(cardElement)) {
        console.log(`⏭️ 카드 ${cardIndex}는 이미 열려있습니다.`);
        if (callback) callback();
        return;
    }
    */

    console.log(`👆 카드 ${cardIndex} 강제 클릭 시작...`);

    // 카드 요소에 대한 상세 정보 출력
    console.log('카드 요소 정보:', {
        tagName: cardElement.tagName,
        className: cardElement.className,
        id: cardElement.id,
        dataIndex: cardElement.dataset.index,
        onclick: cardElement.onclick ? 'O' : 'X',
        disabled: cardElement.disabled,
        style: cardElement.style.cssText
    });

    // 마우스 클릭 이벤트 시뮬레이션
    simulateCardClick(cardElement);

    // 클릭 완료 후 콜백 실행
    if (callback) {
        setTimeout(callback, 300);
    }
}

// 🔄 게임 상태 완전 초기화 유틸리티 함수
function resetGameState() {
    console.log("🔄 게임 상태 완전 초기화 중...");

    // 기존 게임 상태 정리
    if (window.__gameState) {
        if (window.__gameState.cardMemory) {
            window.__gameState.cardMemory.clear();
            console.log("✅ 카드 메모리 정리 완료");
        }
        delete window.__gameState;
        console.log("✅ 게임 상태 객체 삭제 완료");
    }

    // 기존 게임 진행 함수 정리
    if (window.__playNextMove) {
        delete window.__playNextMove;
        console.log("✅ 게임 진행 함수 정리 완료");
    }

    // 기존 자동 클릭 이벤트 리스너 정리
    if (window.__cardClickHandler) {
        document.removeEventListener('click', window.__cardClickHandler);
        delete window.__cardClickHandler;
        console.log("✅ 자동 클릭 이벤트 정리 완료");
    }

    // 카드 요소들의 이벤트 리스너 정리 (클론으로 교체)
    const existingCards = document.querySelectorAll('[data-card-index]');
    existingCards.forEach((card, index) => {
        if (card.parentNode) {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        }
    });

    if (existingCards.length > 0) {
        console.log(`✅ ${existingCards.length}개 카드 이벤트 리스너 정리 완료`);
    }

    console.log("🎉 게임 상태 완전 초기화 완료!");
}

function findGameCardElements() {
    console.log("게임 카드 요소 탐색 시작...");

    // ⚠️ 중요: 우리가 만든 UI 패널의 카드들은 제외해야 함!
    const ourUIContainer = document.getElementById("card-memo-container");

    // 게임이 시작되지 않았을 수도 있으므로 더 광범위하게 탐색
    console.log("🎮 Lost Ark 카드 게임 구조 분석...");

    // 1. 캔버스나 게임 영역 확인
    const canvas = document.querySelector('canvas');
    if (canvas) {
        console.log('🎨 캔버스 발견 - 게임이 캔버스 기반일 수 있음');
    }

    // 2. 게임 시작 후 동적으로 생성되는 요소들 찾기
    const gameContainer = document.querySelector('#gameArea, .game-container, .card-container, .game-board, .promotion-game-area');
    if (gameContainer) {
        console.log('🎯 게임 컨테이너 발견:', gameContainer.tagName + '.' + gameContainer.className);

        // 게임 컨테이너 내부의 모든 클릭 가능한 요소들 찾기
        let gameElements = Array.from(gameContainer.querySelectorAll('div, button, canvas, [data-index], [onclick]'));

        // 우리 UI 제외
        if (ourUIContainer) {
            gameElements = gameElements.filter(el => !ourUIContainer.contains(el));
        }

        console.log(`게임 컨테이너 내부 요소들: ${gameElements.length}개`);

        if (gameElements.length >= 18) {
            console.log(`✅ 게임 컨테이너에서 카드 후보 발견: ${gameElements.length}개`);
            return gameElements.slice(0, 18);
        }
    }

    // 3. 모든 div 요소 중에서 카드 같은 것들 찾기 (크기 기반)
    let allDivs = Array.from(document.querySelectorAll('div'));

    // 우리 UI 제외
    if (ourUIContainer) {
        allDivs = allDivs.filter(el => !ourUIContainer.contains(el));
    }

    // 카드 크기로 추정되는 div들 찾기 (보통 카드는 비슷한 크기)
    const cardSizedDivs = allDivs.filter(div => {
        const rect = div.getBoundingClientRect();
        // 카드 크기로 추정 (50x50 ~ 200x300 정도)
        return rect.width >= 50 && rect.width <= 200 &&
            rect.height >= 50 && rect.height <= 300 &&
            rect.width > 0 && rect.height > 0;
    });

    console.log(`카드 크기로 추정되는 div들: ${cardSizedDivs.length}개`);

    if (cardSizedDivs.length >= 18) {
        console.log(`✅ 크기 기반으로 카드 후보 발견: ${cardSizedDivs.length}개`);
        return cardSizedDivs.slice(0, 18);
    }

    // 4. Lost Ark 특화 셀렉터들 시도
    const lostarkSelectors = [
        '.card',
        '.item',
        '.slot',
        '.tile',
        '.grid-item',
        '[class*="card"]',
        '[class*="item"]',
        '[class*="slot"]',
        '[style*="cursor: pointer"]',
        '[style*="cursor:pointer"]'
    ];

    for (const selector of lostarkSelectors) {
        let elements = Array.from(document.querySelectorAll(selector));

        // 우리 UI 제외
        if (ourUIContainer) {
            elements = elements.filter(el => !ourUIContainer.contains(el));
        }

        console.log(`셀렉터 "${selector}": ${elements.length}개 요소 발견`);

        if (elements.length >= 18) {
            console.log(`✅ Lost Ark 셀렉터로 카드 요소 발견: ${selector}`);
            return elements.slice(0, 18);
        }
    }

    // 5. 실제 onclick이나 이벤트 리스너가 있는 요소들 찾기
    let allElements = Array.from(document.querySelectorAll('*'));

    // 우리 UI 제외
    if (ourUIContainer) {
        allElements = allElements.filter(el => !ourUIContainer.contains(el));
    }

    const interactiveElements = allElements.filter(el => {
        return el.onclick ||
            el.addEventListener ||
            getComputedStyle(el).cursor === 'pointer' ||
            el.style.cursor === 'pointer';
    });

    console.log(`인터랙티브 요소들: ${interactiveElements.length}개`);

    if (interactiveElements.length >= 18) {
        console.log(`✅ 인터랙티브 요소들 중에서 카드 후보 발견`);
        return interactiveElements.slice(0, 18);
    }

    // 6. 게임이 아직 시작되지 않은 경우를 위한 대안
    console.log('⚠️ 카드 요소를 찾을 수 없습니다. 게임이 시작되지 않았을 수 있습니다.');
    console.log('� 해결 방법:');
    console.log('1. 게임을 먼저 시작해주세요 (게임 시작 버튼 클릭)');
    console.log('2. 카드가 화면에 나타난 후 다시 자동 클릭을 시도해주세요');
    console.log('3. 또는 수동으로 몇 장의 카드를 클릭한 후 시도해주세요');

    return null;
}

function isCardAlreadyOpen(cardElement) {
    console.log(`🔍 카드 상태 확인:`, cardElement);

    // 카드가 이미 열려있는지 확인하는 로직
    // Lost Ark 게임에 맞게 조정

    // 방법 1: disabled 속성 확인
    if (cardElement.disabled || cardElement.getAttribute('disabled') !== null) {
        console.log('❌ disabled 속성으로 인해 열려있음');
        return true;
    }

    // 방법 2: 클래스명으로 확인
    const classList = cardElement.className;
    const openClasses = ['opened', 'flipped', 'revealed', 'matched', 'done', 'disabled'];
    for (const openClass of openClasses) {
        if (classList.includes(openClass)) {
            console.log(`❌ 클래스 "${openClass}"로 인해 열려있음`);
            return true;
        }
    }

    // 방법 3: 스타일로 확인 (display: none, visibility: hidden 등)
    const computedStyle = getComputedStyle(cardElement);
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.log('❌ 스타일로 인해 숨겨져 있음');
        return true;
    }

    // 방법 4: 자식 요소의 이미지 확인
    const img = cardElement.querySelector('img');
    if (img && img.src && !img.src.includes('card-back') && !img.src.includes('default')) {
        console.log('❌ 이미지가 이미 표시되어 있음');
        return true;
    }

    // 방법 5: data 속성 확인
    if (cardElement.dataset.opened === 'true' || cardElement.dataset.state === 'opened') {
        console.log('❌ data 속성으로 인해 열려있음');
        return true;
    }

    console.log('✅ 카드가 닫혀있음 - 클릭 가능');
    return false;
}

function simulateCardClick(element) {
    console.log(`🖱️ 카드 클릭 시뮬레이션 시작 (자연스러운 방식):`, element);

    // 요소가 보이는 영역에 있는지 확인하고 스크롤
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 자연스러운 지연 후 클릭 (인간적인 패턴)
    setTimeout(() => {
        console.log('⏳ 자연스러운 지연 후 클릭 시작...');

        // 방법 1: 가장 자연스러운 마우스 이벤트 시퀀스만 사용
        try {
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 10; // 약간의 랜덤성
            const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 10;  // 약간의 랜덤성

            // 자연스러운 마우스 이벤트 순서
            const naturalMouseSequence = [
                { type: 'mouseover', delay: 0 },
                { type: 'mouseenter', delay: 50 },
                { type: 'mousemove', delay: 100 },
                { type: 'mousedown', delay: 150 },
                { type: 'mouseup', delay: 200 },
                { type: 'click', delay: 250 }
            ];

            naturalMouseSequence.forEach(({ type, delay }) => {
                setTimeout(() => {
                    const event = new MouseEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: type === 'click' ? 1 : 0,
                        button: 0,
                        buttons: type === 'mousedown' ? 1 : 0,
                        clientX: x,
                        clientY: y,
                        screenX: x + window.screenX,
                        screenY: y + window.screenY,
                        isTrusted: false  // 명시적으로 false로 설정
                    });

                    element.dispatchEvent(event);
                    console.log(`🖱️ ${type} 이벤트 발송 (${x.toFixed(1)}, ${y.toFixed(1)})`);

                    if (type === 'click') {
                        console.log('✅ 자연스러운 클릭 시퀀스 완료');
                    }
                }, delay);
            });

        } catch (e) {
            console.log('❌ 자연스러운 마우스 이벤트 실패:', e);

            // 대안: 직접 클릭만 시도
            try {
                element.click();
                console.log('✅ 대안 클릭 성공');
            } catch (e2) {
                console.log('❌ 대안 클릭도 실패:', e2);
            }
        }

    }, 300 + Math.random() * 200); // 300-500ms 랜덤 지연
}

function debugGameStructure() {
    console.log("🔍 게임 구조 분석 시작...");
    console.log("==========================================");

    // 기본 정보
    console.log("📄 페이지 정보:");
    console.log("- URL:", window.location.href);
    console.log("- Title:", document.title);

    // 우리 UI 컨테이너 확인
    const ourUI = document.getElementById("card-memo-container");
    console.log("🎛️ 우리 UI 컨테이너:", ourUI ? "발견됨" : "없음");

    // 전체 클릭 가능한 요소들 분석
    const allOnclickElements = document.querySelectorAll('[onclick]');
    let realGameElements = Array.from(allOnclickElements);

    // 우리 UI 내부 요소들 제거
    if (ourUI) {
        realGameElements = realGameElements.filter(el => !ourUI.contains(el));
    }

    console.log(`\n🖱️ 전체 onclick 요소: ${allOnclickElements.length}개`);
    console.log(`🎮 실제 게임 onclick 요소 (우리 UI 제외): ${realGameElements.length}개`);

    if (realGameElements.length > 0) {
        console.log("\n실제 게임 onclick 요소들 (처음 10개):");
        realGameElements.slice(0, 10).forEach((el, index) => {
            console.log(`  ${index}: ${el.tagName}.${el.className} - ${el.getAttribute('onclick')?.substring(0, 50)}...`);
        });
    }

    // 버튼 요소들 분석 (우리 UI 제외)
    const allButtons = document.querySelectorAll('button');
    let realGameButtons = Array.from(allButtons);
    if (ourUI) {
        realGameButtons = realGameButtons.filter(el => !ourUI.contains(el));
    }
    console.log(`\n🔘 전체 버튼 요소: ${allButtons.length}개`);
    console.log(`🔘 실제 게임 버튼 요소: ${realGameButtons.length}개`);

    // data-index 속성이 있는 요소들 분석
    const allDataIndexElements = document.querySelectorAll('[data-index]');
    let realGameDataIndex = Array.from(allDataIndexElements);
    if (ourUI) {
        realGameDataIndex = realGameDataIndex.filter(el => !ourUI.contains(el));
    }
    console.log(`\n📊 전체 data-index 요소: ${allDataIndexElements.length}개`);
    console.log(`📊 실제 게임 data-index 요소: ${realGameDataIndex.length}개`);

    if (realGameDataIndex.length > 0) {
        console.log("실제 게임 data-index 요소들 (처음 5개):");
        realGameDataIndex.slice(0, 5).forEach((el, index) => {
            console.log(`  ${index}: ${el.tagName}.${el.className} data-index="${el.dataset.index}"`);
        });
    }

    // 실제 카드 요소 탐지 시도
    console.log("\n🔎 실제 게임 카드 요소 탐지 결과:");
    const gameCards = findGameCardElements();
    if (gameCards) {
        console.log(`✅ 실제 게임 카드 요소 ${gameCards.length}개 발견`);
        console.log("첫 3개 실제 게임 카드 정보:");
        gameCards.slice(0, 3).forEach((card, index) => {
            console.log(`  실제 카드 ${index}:`, {
                tag: card.tagName,
                class: card.className,
                id: card.id,
                dataIndex: card.dataset.index,
                onclick: card.onclick ? 'O' : 'X',
                text: card.textContent?.substring(0, 30)
            });
        });

        // 첫 번째 카드의 onclick 내용도 확인
        if (gameCards[0] && gameCards[0].onclick) {
            console.log("첫 번째 카드의 onclick 함수:", gameCards[0].onclick.toString().substring(0, 100) + "...");
        }

    } else {
        console.log("❌ 실제 게임 카드 요소를 찾을 수 없음");
    }

    console.log("==========================================");
    console.log("🎯 분석 완료! 이제 실제 게임 카드만 대상으로 합니다.");
}

// ====================================================================================================
// 12. 메인 초기화 함수
// ====================================================================================================

function setupCardMemoUI() {
    // UI 컴포넌트 생성
    const container = createMainPanel();
    const header = createHeader();
    const resizeHandle = createResizeHandle();
    const { grid, cardSlots } = createCardGrid();

    // 설명 텍스트
    const description = document.createElement("div");
    description.textContent = "클릭한 카드가 열리면 해당 칸에 이미지가 저장됩니다.";
    Object.assign(description.style, {
        marginTop: "6px",
        fontSize: "11px",
        color: "rgba(0,0,0,0.6)"
    });

    // 컨테이너에 요소들 추가
    container.appendChild(header);
    container.appendChild(resizeHandle);
    container.appendChild(grid);
    container.appendChild(description);

    // 페이지에 추가
    document.body.appendChild(container);

    // 기능 설정
    const currentSettings = restorePanelPosition(container);
    setupDragFunctionality(container, header);
    setupResizeFunctionality(container, resizeHandle, currentSettings);

    return { container, cardSlots };
}

// ====================================================================================================
// 13. 최종 실행
// ====================================================================================================

function runCardMemoHelper() {
    // 1. 초기화
    initializeCardMemoHelper();

    // 2. UI 생성
    setupCardMemoUI();

    // 3. 네트워크 감지 시작
    interceptNetworkRequests();

    // 4. 초기 화면 업데이트
    updateCardDisplay();

    // 5. 완전 자동화 버튼 생성
    createFullAutoButton();

    console.log("Card Memo Helper 설치 완료 - 드래그 & 크기조절 지원, 완전 자동화 기능 포함");
}

// ====================================================================================================
// 14. 완전 자동화 기능 (게임 시작부터 끝까지)
// ====================================================================================================

// 완전 자동화 버튼 생성 (게임 시작부터 끝까지)
function createFullAutoButton() {
    // 기존 버튼이 있으면 제거
    const existingButton = document.getElementById('fullAutoButton');
    if (existingButton) {
        existingButton.remove();
    }

    const existingStopButton = document.getElementById('stopAutoButton');
    if (existingStopButton) {
        existingStopButton.remove();
    }

    // 완전 자동화 버튼 생성
    const fullAutoButton = document.createElement('button');
    fullAutoButton.id = 'fullAutoButton';
    fullAutoButton.textContent = '🤖 완전 자동 플레이';
    fullAutoButton.style.cssText = `
        position: fixed;
        top: 120px;
        right: 20px;
        z-index: 9999;
        padding: 15px 25px;
        background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;

    // 자동화 중단 버튼도 함께 생성
    const stopAutoButton = document.createElement('button');
    stopAutoButton.id = 'stopAutoButton';
    stopAutoButton.textContent = '⏹️ 자동화 중단';
    stopAutoButton.style.cssText = `
        position: fixed;
        top: 180px;
        right: 20px;
        z-index: 9999;
        padding: 10px 20px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 15px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        display: none;
    `;

    // 호버 효과
    fullAutoButton.addEventListener('mouseenter', () => {
        fullAutoButton.style.transform = 'scale(1.05)';
        fullAutoButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
    });

    fullAutoButton.addEventListener('mouseleave', () => {
        fullAutoButton.style.transform = 'scale(1)';
        fullAutoButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
    });

    // 클릭 이벤트
    fullAutoButton.addEventListener('click', () => {
        startFullAutoGame();
        // 자동화 시작시 중단 버튼 표시
        stopAutoButton.style.display = 'block';
        fullAutoButton.style.display = 'none';
    });

    // 중단 버튼 이벤트
    stopAutoButton.addEventListener('click', () => {
        stopFullAutoGame();
        // 중단시 원래 버튼으로 복귀
        stopAutoButton.style.display = 'none';
        fullAutoButton.style.display = 'block';
    });

    document.body.appendChild(fullAutoButton);
    document.body.appendChild(stopAutoButton);
    console.log('🤖 완전 자동 플레이 버튼이 생성되었습니다!');
}

// 자동화 상태 표시 생성
function createAutoStatusDisplay() {
    // 기존 상태 표시가 있으면 제거
    const existingStatus = document.getElementById('autoStatusDisplay');
    if (existingStatus) {
        existingStatus.remove();
    }

    // 상태 표시 생성
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'autoStatusDisplay';
    statusDisplay.style.cssText = `
        position: fixed;
        top: 240px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        background: rgba(0,0,0,0.85);
        color: white;
        border-radius: 15px;
        font-family: monospace;
        font-size: 14px;
        min-width: 250px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.1);
    `;

    // 토큰 표시와 상태 정보가 포함된 기본 HTML 구조
    statusDisplay.innerHTML = `
        <div style="color: #4ECDC4; font-weight: bold; margin-bottom: 10px;">🤖 자동화 진행 중</div>
        <div id="tokenDisplay" style="background: rgba(255,193,7,0.2); padding: 5px 10px; border-radius: 5px; margin-bottom: 8px; text-align: center;">
            🪙 토큰: <span id="currentTokenCount">확인 중...</span>개
        </div>
        <div id="statusStep">📍 준비 중...</div>
        <div id="statusMessage" style="margin-top: 3px; font-size: 12px;">시작 대기 중...</div>
        <div id="statusTime" style="margin-top: 5px; font-size: 11px; color: #ccc;">${new Date().toLocaleTimeString()}</div>
    `;

    document.body.appendChild(statusDisplay);
    return statusDisplay;
}

// 자동화 상태 업데이트
function updateAutoStatus(step, message, tokenCount = null) {
    let statusDisplay = document.getElementById('autoStatusDisplay');
    if (!statusDisplay) {
        statusDisplay = createAutoStatusDisplay();
    }

    // 각 요소 개별 업데이트
    const stepElement = statusDisplay.querySelector('#statusStep');
    const messageElement = statusDisplay.querySelector('#statusMessage');
    const timeElement = statusDisplay.querySelector('#statusTime');
    const tokenElement = statusDisplay.querySelector('#currentTokenCount');

    if (stepElement) stepElement.textContent = `📍 ${step}`;
    if (messageElement) messageElement.textContent = message;
    if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();

    // 토큰 수 업데이트 (토큰 수가 제공되거나 전역 상태에 있을 때)
    if (tokenCount !== null) {
        window.__fullAutoState = window.__fullAutoState || {};
        window.__fullAutoState.tokenCount = tokenCount;
    }

    if (tokenElement && window.__fullAutoState?.tokenCount !== undefined) {
        tokenElement.textContent = window.__fullAutoState.tokenCount;

        // 토큰 수에 따른 색상 변경
        const tokenDisplay = statusDisplay.querySelector('#tokenDisplay');
        if (tokenDisplay) {
            if (window.__fullAutoState.tokenCount <= 1) {
                tokenDisplay.style.background = 'rgba(255,82,82,0.3)'; // 빨간색
            } else if (window.__fullAutoState.tokenCount <= 3) {
                tokenDisplay.style.background = 'rgba(255,193,7,0.3)'; // 노란색
            } else {
                tokenDisplay.style.background = 'rgba(76,175,80,0.3)'; // 초록색
            }
        }
    }
}

// 자동화 완료 시 상태 표시 제거
function removeAutoStatusDisplay() {
    const statusDisplay = document.getElementById('autoStatusDisplay');
    if (statusDisplay) {
        setTimeout(() => {
            statusDisplay.style.background = 'rgba(76, 175, 80, 0.9)';
            statusDisplay.innerHTML = `
                <div style="color: white; font-weight: bold;">✅ 자동화 완료</div>
                <div style="margin-top: 5px; font-size: 12px;">모든 토큰 사용 완료</div>
            `;

            setTimeout(() => {
                statusDisplay.remove();
            }, 5000);
        }, 1000);
    }
}

// 완전 자동 게임 시작 (처음부터 끝까지)
function startFullAutoGame() {
    console.log("🚀 완전 자동 게임 시작!");

    const confirmation = confirm(
        "🤖 완전 자동 카드 게임을 시작합니다!\n\n" +
        "이 기능은 다음을 자동으로 수행합니다:\n" +
        "1. '게임 플레이' 버튼 클릭\n" +
        "2. 토큰 사용 확인 (토큰 1개 남으면 자동 중단)\n" +
        "3. 참가상 아이템 획득 확인\n" +
        "4. 카드 매칭 게임 자동 진행\n" +
        "5. 게임 완료 후 경품 응모권 확인\n\n" +
        "⚠️ 주의: 토큰이 1개 남으면 자동으로 중단됩니다\n\n" +
        "게임을 완전 자동화하시겠습니까?"
    );

    if (!confirmation) {
        console.log("❌ 사용자가 완전 자동화를 취소했습니다.");
        return;
    }

    // 전체 자동화 상태 초기화
    window.__fullAutoState = {
        running: true,
        currentStep: 'start',
        tokenCount: null
    };

    console.log("✅ 완전 자동화 시작! 단계별 진행을 시작합니다.");

    // 상태 표시 생성
    updateAutoStatus("1단계", "게임 플레이 버튼 검색 중...");

    // 1단계: 게임 플레이 버튼 찾아서 클릭
    setTimeout(() => {
        clickPlayButton();
    }, 1000);
}

// 1단계: 게임 플레이 버튼 클릭
function clickPlayButton() {
    console.log("🎮 1단계: 게임 플레이 버튼 검색 중...");

    // playBtn 찾기
    const playBtn = document.getElementById('playBtn');

    if (playBtn && playBtn.textContent.includes('게임 플레이')) {
        console.log("✅ 게임 플레이 버튼 발견!");

        // 자연스러운 클릭
        setTimeout(() => {
            try {
                playBtn.click();
                console.log("✅ 게임 플레이 버튼 클릭 완료");

                // 2단계로 진행 (토큰 사용 확인 모달 대기)
                window.__fullAutoState.currentStep = 'token_confirm';
                updateAutoStatus("2단계", "토큰 사용 확인 모달 대기 중...");
                setTimeout(() => {
                    checkTokenConfirmModal();
                }, 2000);

            } catch (e) {
                console.log("❌ 게임 플레이 버튼 클릭 실패:", e);
                alert("게임 플레이 버튼을 클릭할 수 없습니다.\n수동으로 클릭해주세요.");
            }
        }, 500);

    } else {
        console.log("❌ 게임 플레이 버튼을 찾을 수 없습니다.");

        // 대안: 다른 방법으로 버튼 찾기
        const alternativeButtons = document.querySelectorAll('button');
        let found = false;

        for (const btn of alternativeButtons) {
            if (btn.textContent.includes('게임 플레이') || btn.textContent.includes('플레이')) {
                console.log("✅ 대안 방법으로 게임 플레이 버튼 발견!");
                btn.click();
                found = true;
                window.__fullAutoState.currentStep = 'token_confirm';
                setTimeout(() => checkTokenConfirmModal(), 2000);
                break;
            }
        }

        if (!found) {
            alert("게임 플레이 버튼을 찾을 수 없습니다.\n페이지를 새로고침하고 다시 시도해주세요.");
        }
    }
}

// 2단계: 토큰 사용 확인 모달 처리
function checkTokenConfirmModal() {
    console.log("🪙 2단계: 토큰 사용 확인 모달 검색 중...");
    updateAutoStatus("2단계", "토큰 사용 확인 모달 검색 중...");

    let attempts = 0;
    const maxAttempts = 10;

    const checkModal = () => {
        attempts++;
        console.log(`🔍 토큰 모달 검색 시도 ${attempts}/${maxAttempts}`);
        updateAutoStatus("2단계", `토큰 모달 검색 시도 ${attempts}/${maxAttempts}`);

        // 토큰 사용 모달 찾기
        const modals = document.querySelectorAll('.lui-modal__content, [class*="modal"], [class*="popup"]');

        for (const modal of modals) {
            const text = modal.textContent || modal.innerText;

            if (text.includes('토큰을 사용하여') && text.includes('카드 메모리 게임을') && text.includes('보유 중인 토큰')) {
                console.log("✅ 토큰 사용 확인 모달 발견!");
                updateAutoStatus("2단계", "토큰 사용 확인 모달 발견!");

                // 토큰 개수 추출
                const tokenMatch = text.match(/보유 중인 토큰\s*:\s*.*?(\d+)개/);
                if (tokenMatch) {
                    const tokenCount = parseInt(tokenMatch[1]);
                    window.__fullAutoState.tokenCount = tokenCount;
                    console.log(`🪙 현재 토큰 개수: ${tokenCount}개`);

                    // 토큰 수를 상태창에 업데이트
                    updateAutoStatus("2단계", "토큰 사용 확인 모달 발견!", tokenCount);

                    // 토큰이 1개면 중단
                    if (tokenCount <= 1) {
                        console.log("⚠️ 토큰이 1개 이하입니다. 자동화를 중단합니다.");
                        updateAutoStatus("중단됨", `토큰이 ${tokenCount}개만 남았습니다. 자동화를 중단합니다.`, tokenCount);
                        console.log(`⚠️ 토큰이 ${tokenCount}개 남았습니다! 자동화를 중단합니다. 마지막 토큰은 수동으로 사용하세요.`);
                        window.__fullAutoState.running = false;
                        return;
                    }
                }

                // 확인 버튼 클릭
                const confirmBtn = modal.querySelector('.lui-modal__confirm') ||
                    modal.parentElement.querySelector('.lui-modal__confirm') ||
                    findConfirmButtonInModal(modal);

                if (confirmBtn) {
                    console.log("✅ 토큰 사용 확인 버튼 발견!");
                    updateAutoStatus("2단계", "토큰 사용 확인 버튼 클릭!");

                    setTimeout(() => {
                        try {
                            confirmBtn.click();
                            console.log("✅ 토큰 사용 확인 완료");
                            updateAutoStatus("3단계", "토큰 사용 확인 완료! 아이템 획득 모달 대기 중...");

                            // 3단계로 진행 (아이템 획득 모달 대기)
                            window.__fullAutoState.currentStep = 'item_reward';
                            setTimeout(() => {
                                checkItemRewardModal();
                            }, 3000);

                        } catch (e) {
                            console.log("❌ 토큰 확인 버튼 클릭 실패:", e);
                        }
                    }, 800);

                } else {
                    console.log("❌ 토큰 확인 버튼을 찾을 수 없습니다.");
                }
                return;
            }
        }

        // 재시도
        if (attempts < maxAttempts) {
            setTimeout(checkModal, 1000);
        } else {
            console.log("❌ 토큰 사용 확인 모달을 찾지 못했습니다.");
            alert("토큰 사용 확인 창이 나타나지 않았습니다.\n수동으로 진행해주세요.");
        }
    };

    checkModal();
}

// 3단계: 아이템 획득 모달 처리
function checkItemRewardModal() {
    console.log("🎁 3단계: 아이템 획득 모달 검색 중...");
    updateAutoStatus("3단계", "아이템 획득 모달 검색 중...");

    let attempts = 0;
    const maxAttempts = 15; // 아이템 지급까지 시간이 걸릴 수 있음

    const checkModal = () => {
        attempts++;
        console.log(`🔍 아이템 모달 검색 시도 ${attempts}/${maxAttempts}`);
        updateAutoStatus("3단계", `아이템 모달 검색 시도 ${attempts}/${maxAttempts}`);

        // 아이템 획득 모달 찾기
        const modals = document.querySelectorAll('.lui-modal__body, [class*="modal"], [class*="popup"]');

        for (const modal of modals) {
            const text = modal.textContent || modal.innerText;

            // 아이템 획득 모달 확인
            if ((text.includes('아이템 획득') || text.includes('아이템이 지급')) &&
                (text.includes('상품함을 확인') || text.includes('생명의 기운') || text.includes('지급 되었습니다'))) {

                console.log("✅ 아이템 획득 모달 발견!");
                updateAutoStatus("3단계", "아이템 획득 모달 발견! 확인 버튼 찾는 중...");

                // 아이템 정보 로깅
                const itemWrap = modal.querySelector('.item_wrap, .item');
                if (itemWrap) {
                    const itemText = itemWrap.textContent || itemWrap.innerText;
                    console.log(`🎁 획득한 아이템: ${itemText.trim()}`);
                }

                // 확인 버튼 클릭
                const confirmBtn = modal.querySelector('.lui-modal__confirm') ||
                    findConfirmButtonInModal(modal);

                if (confirmBtn) {
                    console.log("✅ 아이템 획득 확인 버튼 발견!");
                    updateAutoStatus("3단계", "아이템 획득 확인 버튼 클릭!");

                    setTimeout(() => {
                        try {
                            confirmBtn.click();
                            console.log("✅ 아이템 획득 확인 완료");
                            updateAutoStatus("4단계", "아이템 획득 확인 완료! 게임 시작 대기 중...");

                            // 4단계로 진행 (게임 시작 대기)
                            window.__fullAutoState.currentStep = 'game_start';
                            setTimeout(() => {
                                waitForGameStart();
                            }, 3000);

                        } catch (e) {
                            console.log("❌ 아이템 확인 버튼 클릭 실패:", e);
                        }
                    }, 800);

                } else {
                    console.log("❌ 아이템 확인 버튼을 찾을 수 없습니다.");
                }
                return;
            }
        }

        // 재시도
        if (attempts < maxAttempts) {
            setTimeout(checkModal, 1000);
        } else {
            console.log("❌ 아이템 획득 모달을 찾지 못했습니다. 게임이 바로 시작되었을 수 있습니다.");
            // 게임이 바로 시작되었을 가능성 있음
            waitForGameStart();
        }
    };

    checkModal();
}

// 4단계: 게임 시작 대기 및 자동 매칭 시작
function waitForGameStart() {
    console.log("🎮 4단계: 카드 게임 시작 대기 중...");
    updateAutoStatus("4단계", "카드 게임 시작 대기 중...");

    let attempts = 0;
    const maxAttempts = 10;

    const checkGameStart = () => {
        attempts++;
        console.log(`🔍 게임 시작 확인 시도 ${attempts}/${maxAttempts}`);
        updateAutoStatus("4단계", `게임 시작 확인 시도 ${attempts}/${maxAttempts}`);

        if (checkIfGameStarted()) {
            console.log("✅ 카드 게임이 시작되었습니다!");
            updateAutoStatus("5단계", "카드 게임 시작됨! 게임 상태 초기화 중...");

            // 🔄 게임 상태 완전 초기화 (새 게임을 위해)
            resetGameState();

            updateAutoStatus("5단계", "게임 상태 초기화 완료! 실시간 자동 매칭 시작!");

            // 5단계: 실시간 매칭 시작
            window.__fullAutoState.currentStep = 'playing';
            setTimeout(() => {
                console.log("🧠 5단계: 실시간 자동 매칭 시작!");
                startRealTimeMatching();
            }, 2000);

        } else {
            if (attempts < maxAttempts) {
                setTimeout(checkGameStart, 2000);
            } else {
                console.log("❌ 게임이 시작되지 않았습니다.");
                alert("게임이 시작되지 않았습니다.\n수동으로 게임을 시작해주세요.");
            }
        }
    };

    checkGameStart();
}

// 모달에서 확인 버튼 찾는 헬퍼 함수
function findConfirmButtonInModal(modal) {
    const selectors = [
        '.lui-modal__confirm',
        'button[class*="confirm"]',
        'button[type="button"]',
        '.modal button',
        '.popup button'
    ];

    for (const selector of selectors) {
        const btn = modal.querySelector(selector);
        if (btn) return btn;

        // 부모 요소에서도 찾기
        if (modal.parentElement) {
            const parentBtn = modal.parentElement.querySelector(selector);
            if (parentBtn) return parentBtn;
        }
    }

    // 텍스트로 찾기
    const allBtns = modal.querySelectorAll('button');
    for (const btn of allBtns) {
        const text = btn.textContent || btn.innerText;
        if (text.includes('확인') || text.includes('OK') || text === '확인') {
            return btn;
        }
    }

    return null;
}

// 실시간 매칭 시스템 (도전 기회 절약)
function startRealTimeMatching() {
    console.log("🧠 실시간 매칭 시스템 시작!");
    updateAutoStatus("5단계", "실시간 매칭 시스템 시작!");

    // 🔄 기존 게임 상태 완전 정리 (중요!)
    resetGameState();

    const gameCards = findGameCardElements();
    if (!gameCards || gameCards.length === 0) {
        console.log("❌ 게임 카드를 찾을 수 없습니다.");
        updateAutoStatus("5단계", "❌ 게임 카드를 찾을 수 없음");
        return;
    }

    console.log(`🎮 총 ${gameCards.length}개 카드로 실시간 매칭 시작`);
    updateAutoStatus("5단계", `총 ${gameCards.length}개 카드로 실시간 매칭 중...`);

    // 🆕 새로운 게임 상태 설정 (완전 초기화된 상태)
    window.__gameState = {
        cardMemory: new Map(),
        isProcessing: false,
        gameCompleted: false,
        gameCards: gameCards
    };

    console.log("✅ 게임 상태 완전 초기화 완료! 새 게임 시작");

    // 게임 진행 함수를 전역으로 정의
    window.__playNextMove = function () {
        // 자동화 중단 확인
        if (window.__fullAutoState && !window.__fullAutoState.running) {
            console.log("⏹️ 자동화가 중단되어 게임 진행을 멈춥니다.");
            return;
        }

        if (window.__gameState.isProcessing || window.__gameState.gameCompleted) {
            console.log("⏳ 이미 처리 중이거나 게임 완료됨");
            return;
        }

        // 무한 루프 방지를 위한 안전장치
        if (window.__gameState.stepCount === undefined) {
            window.__gameState.stepCount = 0;
        }

        window.__gameState.stepCount++;

        if (window.__gameState.stepCount > 50) {
            console.log("⚠️ 최대 단계 수 초과 - 무한 루프 방지로 중단");
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        window.__gameState.isProcessing = true;
        console.log(`🔄 다음 단계 시작... (${window.__gameState.stepCount}/50)`);

        // 실제 게임 카드 요소들이 아직 존재하는지 먼저 확인
        const currentGameCards = findGameCardElements();
        if (!currentGameCards || currentGameCards.length === 0) {
            console.log("❌ 게임 카드가 사라짐 - 게임 완료로 간주");
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        // 경품 응모권 모달 확인 (매 단계마다 확인)
        const prizeModalCheck = checkAllCardsMatched();
        if (prizeModalCheck) {
            console.log("🎉 경품 응모권 지급 모달 발견! 게임 완료!");
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        // 최소 진행 조건 확인 (경품 모달이 없으면 계속 진행)
        if (window.__gameState.stepCount >= 5) {
            console.log(`⏳ 단계 ${window.__gameState.stepCount}: 경품 모달 대기 중... (카드 기억: ${window.__gameState.cardMemory.size}개)`);
        }

        // 1단계: 기억하고 있는 카드 중 매칭 가능한 쌍이 있는지 확인
        const knownMatch = findKnownMatch(window.__gameState.cardMemory);
        if (knownMatch) {
            console.log(`💡 기억된 매칭 쌍 발견: 카드 ${knownMatch[0]} ↔ ${knownMatch[1]}`);
            window.__gameState.isProcessing = false; // 처리 상태 해제
            executeKnownMatchSafe(knownMatch[0], knownMatch[1]);
            return;
        }

        // 2단계: 새로운 카드 탐색
        const nextUnknownCard = findNextUnknownCard(window.__gameState.cardMemory, window.__gameState.gameCards);
        if (nextUnknownCard === -1) {
            console.log("❓ 더 이상 탐색할 카드가 없습니다.");

            // 경품 모달 마지막 확인
            const finalPrizeCheck = checkAllCardsMatched();
            if (finalPrizeCheck) {
                console.log("🎉 마지막 확인에서 경품 모달 발견! 게임 완료!");
                window.__gameState.gameCompleted = true;
                showGameCompleteMessage();
                return;
            }

            // 모든 카드를 확인했지만 경품 모달이 나타나지 않음 - 정지
            const totalCards = window.__gameState.gameCards.length;
            const knownCards = window.__gameState.cardMemory.size;

            console.log(`📊 총 카드: ${totalCards}개, 기억된 카드: ${knownCards}개`);

            if (knownCards >= totalCards - 2) {
                console.log("⚠️ 거의 모든 카드를 확인했으나 경품 모달 없음 - 매칭 실패로 게임 정지");
                window.__gameState.gameCompleted = true;

                // 매칭 실패 알림
                setTimeout(() => {
                    console.log("❌ 게임 매칭 실패 - 경품 응모권이 지급되지 않았습니다.");
                    console.log("🛑 자동화를 정지합니다. 수동으로 게임을 확인해주세요.");

                    if (window.__fullAutoState) {
                        window.__fullAutoState.running = false;
                        updateAutoStatus("정지됨", "경품 모달이 나타나지 않아 정지됨");
                    }
                }, 1000);
                return;
            }

            // 3초 대기 후 한 번 더 확인
            window.__gameState.isProcessing = false;
            console.log("⏳ 3초 후 경품 모달 재확인...");
            setTimeout(() => {
                if (!window.__gameState.gameCompleted) {
                    const retryPrizeCheck = checkAllCardsMatched();
                    if (retryPrizeCheck) {
                        window.__gameState.gameCompleted = true;
                        showGameCompleteMessage();
                    } else {
                        console.log("⚠️ 경품 모달이 나타나지 않음 - 게임 정지");
                        window.__gameState.gameCompleted = true;

                        if (window.__fullAutoState) {
                            window.__fullAutoState.running = false;
                            console.log("🛑 경품 모달 미출현으로 자동화 정지");
                        }
                    }
                }
            }, 3000);
            return;
        }

        console.log(`🔍 새 카드 ${nextUnknownCard} 탐색 중...`);

        // 카드 클릭하여 내용 확인
        setTimeout(() => {
            // 중단 확인
            if (window.__fullAutoState && !window.__fullAutoState.running) {
                console.log("⏹️ 자동화 중단됨");
                window.__gameState.isProcessing = false;
                return;
            }

            console.log(`🎯 카드 ${nextUnknownCard} 클릭 시도 중...`);
            clickGameCardNaturally(nextUnknownCard);

            // 카드 내용 읽기 대기 (더 충분한 시간)
            setTimeout(() => {
                const cardContent = getCardContent(window.__gameState.gameCards[nextUnknownCard]);
                window.__gameState.cardMemory.set(nextUnknownCard, cardContent);
                console.log(`📝 카드 ${nextUnknownCard} 기억됨: ${cardContent}`);

                // 즉시 매칭 쌍 검사
                const immediateMatch = findImmediateMatch(nextUnknownCard, cardContent, window.__gameState.cardMemory);

                if (immediateMatch !== -1) {
                    console.log(`⚡ 즉시 매칭 발견! 카드 ${nextUnknownCard} ↔ ${immediateMatch}`);

                    // 매칭 쌍 즉시 클릭
                    setTimeout(() => {
                        console.log(`🎯 매칭 카드 ${immediateMatch} 클릭 시도 중...`);
                        clickGameCardNaturally(immediateMatch);

                        // 매칭 완료 후 다음 단계
                        setTimeout(() => {
                            window.__gameState.isProcessing = false;
                            console.log("✅ 즉시 매칭 완료! 다음 단계 진행...");
                            setTimeout(() => {
                                if (window.__playNextMove) window.__playNextMove();
                            }, 1500);
                        }, 1500);

                    }, 800 + Math.random() * 400);

                } else {
                    // 매칭되지 않음 - 다음 단계 진행
                    console.log("❌ 현재 카드는 매칭되지 않음. 계속 탐색...");
                    setTimeout(() => {
                        window.__gameState.isProcessing = false;
                        if (window.__playNextMove) window.__playNextMove();
                    }, 1000 + Math.random() * 500);
                }

            }, 1000); // 카드 내용 읽기 시간을 1초로 증가

        }, 400 + Math.random() * 200);
    };

    // 게임 시작
    console.log("🎯 실시간 매칭 게임 시작!");
    window.__playNextMove();
}

// 기억된 카드 중 매칭 가능한 쌍 찾기
function findKnownMatch(cardMemory) {
    const knownCards = Array.from(cardMemory.entries());

    for (let i = 0; i < knownCards.length; i++) {
        for (let j = i + 1; j < knownCards.length; j++) {
            const [index1, content1] = knownCards[i];
            const [index2, content2] = knownCards[j];

            // 같은 내용이고 아직 매칭되지 않은 카드인지 확인
            if (content1 === content2 && !isCardMatched(index1) && !isCardMatched(index2)) {
                return [index1, index2];
            }
        }
    }

    return null;
}

// 즉시 매칭 쌍 찾기 (방금 클릭한 카드와 기억된 카드들 비교)
function findImmediateMatch(newCardIndex, newCardContent, cardMemory) {
    for (const [index, content] of cardMemory.entries()) {
        if (index !== newCardIndex && content === newCardContent && !isCardMatched(index)) {
            return index;
        }
    }
    return -1;
}

// 다음 탐색할 미지의 카드 찾기
function findNextUnknownCard(cardMemory, gameCards) {
    for (let i = 0; i < gameCards.length; i++) {
        // 아직 기억하지 못했고 매칭되지 않은 카드
        if (!cardMemory.has(i) && !isCardMatched(i)) {
            return i;
        }
    }
    return -1;
}

// 카드가 이미 매칭되었는지 확인 (매우 엄격한 버전)
function isCardMatched(cardIndex) {
    const gameCards = findGameCardElements();
    if (!gameCards || !gameCards[cardIndex]) {
        return false; // 카드가 없으면 매칭되지 않은 것으로 간주
    }

    const card = gameCards[cardIndex];

    console.log(`🔍 카드 ${cardIndex} 매칭 상태 확인 중...`);
    console.log(`   클래스: ${card.className}`);
    console.log(`   disabled: ${card.disabled}`);
    console.log(`   display: ${getComputedStyle(card).display}`);

    // 1. 가장 명확한 매칭 상태 클래스명만 확인
    const definitiveMatchedClasses = [
        'is-matched', 'matched', 'card-matched', 'completed', 'done', 'finished'
    ];

    for (const matchedClass of definitiveMatchedClasses) {
        if (card.classList.contains(matchedClass)) {
            console.log(`✅ 카드 ${cardIndex} 확실히 매칭됨: 클래스 "${matchedClass}"`);
            return true;
        }
    }

    // 2. disabled 상태만 확인 (Lost Ark에서 매칭된 카드는 확실히 disabled됨)
    if (card.disabled === true) {
        console.log(`✅ 카드 ${cardIndex} 확실히 매칭됨: disabled`);
        return true;
    }

    // 3. 완전히 사라진 경우만 매칭된 것으로 간주
    const computedStyle = getComputedStyle(card);
    if (computedStyle.display === 'none') {
        console.log(`✅ 카드 ${cardIndex} 확실히 매칭됨: display none`);
        return true;
    }

    // 기본적으로 매칭되지 않은 것으로 간주 (매우 보수적)
    console.log(`❌ 카드 ${cardIndex} 매칭되지 않음`);
    return false;
}

// 모든 카드가 매칭되었는지 확인 (경품 응모권 모달 기준)
function checkAllCardsMatched() {
    console.log("🔍 게임 완료 상태 확인 중...");

    // 가장 중요한 조건: 경품 응모권 지급 모달이 나타났는지 확인
    const prizeModal = checkForPrizeModal();
    if (prizeModal) {
        console.log("🎉 경품 응모권 지급 모달 발견! - 100% 매칭 성공으로 게임 완료!");
        return true;
    }

    // 경품 모달이 없으면 카드 상태는 확인하지 않고 무조건 미완료로 처리
    console.log("❌ 경품 응모권 모달이 없음 - 게임 아직 완료되지 않음");
    return false;
}

// 경품 응모권 지급 모달 확인 함수
function checkForPrizeModal() {
    console.log("🎁 경품 응모권 모달 검색 중...");

    // 1. Lost Ark CLEAR 모달 확인
    const clearModal = document.querySelector('.lui-modal__body');
    if (clearModal) {
        const titleElement = clearModal.querySelector('.lui-modal__title');
        const contentElement = clearModal.querySelector('.popup_text');

        // 제목에 CLEAR가 있는지 확인
        const hasClearTitle = titleElement && titleElement.textContent.includes('CLEAR');
        console.log(`📋 CLEAR 제목 확인: ${hasClearTitle ? '✅' : '❌'}`);

        // 내용에 경품 응모권 지급 텍스트가 있는지 확인
        let hasPrizeContent = false;
        if (contentElement) {
            const contentText = contentElement.textContent;
            console.log(`� 모달 내용: ${contentText}`);

            hasPrizeContent = contentText.includes('경품 응모권이 지급되었습니다') ||
                contentText.includes('경품') && contentText.includes('지급');
        }
        console.log(`🎁 경품 지급 내용 확인: ${hasPrizeContent ? '✅' : '❌'}`);

        // 둘 다 있어야 진짜 완료
        if (hasClearTitle && hasPrizeContent) {
            console.log("🎊 진짜 게임 완료 모달 발견! CLEAR + 경품 응모권 지급!");
            return {
                modal: clearModal,
                title: titleElement.textContent,
                content: contentElement.textContent
            };
        } else {
            console.log("⚠️ 모달은 있지만 완료 조건 미충족");
        }
    }

    // 2. 대안적인 방법으로 경품 관련 텍스트 찾기
    const allModals = document.querySelectorAll('[class*="modal"], [class*="popup"]');
    for (const modal of allModals) {
        const text = modal.textContent || modal.innerText;
        if (text.includes('CLEAR') &&
            text.includes('경품 응모권이 지급되었습니다') &&
            getComputedStyle(modal).display !== 'none') {
            console.log("🎊 대안 방법으로 완료 모달 발견!");
            return {
                modal: modal,
                content: text
            };
        }
    }

    console.log("❌ 경품 응모권 지급 모달을 찾을 수 없음");
    return null;
}

// 기억된 매칭 쌍 실행 (안전한 버전)
function executeKnownMatchSafe(index1, index2) {
    console.log(`🎯 확실한 매칭 실행: ${index1} ↔ ${index2}`);

    setTimeout(() => {
        clickGameCardNaturally(index1);

        setTimeout(() => {
            clickGameCardNaturally(index2);

            setTimeout(() => {
                console.log("✅ 확실한 매칭 완료!");
                // 전역 함수 사용
                if (window.__playNextMove) {
                    setTimeout(() => window.__playNextMove(), 1500);
                } else {
                    console.log("❌ __playNextMove 함수를 찾을 수 없음");
                }
            }, 1000);

        }, 800 + Math.random() * 400);

    }, 400 + Math.random() * 200);
}

// 기존 함수도 유지 (호환성을 위해)
function executeKnownMatch(index1, index2) {
    console.log(`🎯 확실한 매칭 실행: ${index1} ↔ ${index2}`);

    setTimeout(() => {
        clickGameCardNaturally(index1);

        setTimeout(() => {
            clickGameCardNaturally(index2);

            setTimeout(() => {
                console.log("✅ 확실한 매칭 완료!");
                // 전역 함수가 있으면 사용, 없으면 에러 방지
                if (window.__playNextMove) {
                    setTimeout(() => window.__playNextMove(), 1500);
                } else if (typeof playNextMove !== 'undefined') {
                    setTimeout(() => playNextMove(), 1500);
                } else {
                    console.log("❌ playNextMove 함수를 찾을 수 없음 - 수동으로 진행해주세요");
                }
            }, 1000);

        }, 800 + Math.random() * 400);

    }, 400 + Math.random() * 200);
}

// 게임 완료 메시지
function showGameCompleteMessage() {
    console.log("🎉🎉🎉 실시간 매칭 게임 완료! 🎉🎉🎉");

    // 게임 완료 후 잠시 대기
    setTimeout(() => {
        console.log("🔍 게임 완료 모달 창 찾는 중...");

        // Lost Ark 게임 완료 모달 찾기
        checkForCompletionModal();

        // 완료 모달 처리 후 다음 게임 자동 시작 확인
        setTimeout(() => {
            checkForNextGameAuto();
        }, 5000);

    }, 1000);
}

// 다음 게임 자동 시작 확인
function checkForNextGameAuto() {
    // 완전 자동화 모드이고 아직 실행 중인 경우
    if (window.__fullAutoState && window.__fullAutoState.running) {

        console.log("🔄 다음 게임 자동 시작 확인 중...");

        // 🔄 이전 게임 상태 완전 정리 (다음 게임 준비)
        resetGameState();

        // 토큰 개수 확인 (이전에 저장된 값이 있으면 1개 차감)
        let remainingTokens = window.__fullAutoState.tokenCount;
        if (remainingTokens !== null) {
            remainingTokens -= 1; // 방금 사용한 토큰
            window.__fullAutoState.tokenCount = remainingTokens;

            console.log(`🪙 남은 토큰 예상 개수: ${remainingTokens}개`);

            // 토큰 수 상태창 업데이트
            updateAutoStatus("게임 완료", "다음 게임 준비 중...", remainingTokens);

            if (remainingTokens <= 1) {
                console.log("⚠️ 토큰이 1개 이하가 되어 자동화를 중단합니다.");

                // 확인창 없이 콘솔 로그만 출력
                console.log("🎉 자동화 완료!");
                console.log(`🪙 토큰이 ${remainingTokens}개 남아서 자동화를 중단합니다.`);
                console.log("📝 마지막 토큰은 수동으로 사용하세요!");
                console.log("🏆 완전 자동화로 게임을 성공적으로 완료했습니다!");

                // 자동화 완료 상태 표시
                removeAutoStatusDisplay();

                // 자동화 중단 버튼이 있으면 제거
                const stopButton = document.getElementById('stopAutoButton');
                if (stopButton) {
                    stopButton.remove();
                }

                window.__fullAutoState.running = false;
                return;
            }
        }

        // 토큰이 충분하면 다음 게임 자동 시작
        console.log("🚀 토큰이 충분합니다. 다음 게임을 자동으로 시작합니다...");
        console.log(`🔄 다음 게임 자동 시작! 예상 남은 토큰: ${remainingTokens || '확인 중'}개`);
        console.log("⏰ 3초 후 자동으로 다음 게임이 시작됩니다...");

        // 다음 게임 시작 상태 표시
        updateAutoStatus("다음 게임", "3초 후 자동 시작...", remainingTokens);

        // 확인창 없이 바로 다음 게임 시작 (3초 지연)
        setTimeout(() => {
            console.log("🎮 다음 게임 자동 시작!");
            console.log("==========================================");
            updateAutoStatus("1단계", "게임 플레이 버튼 검색 중...", remainingTokens);
            clickPlayButton(); // 처음부터 다시 시작
        }, 3000);

    } else {
        // 일반 모드 - 단일 게임만 완료
        setTimeout(() => {
            alert("🎉 축하합니다!\n\n실시간 매칭 시스템으로 게임을 완료했습니다!\n\n🧠 도전 기회를 절약하면서 효율적으로 모든 카드를 매칭했습니다.\n\n✅ 확인 버튼도 자동으로 클릭했습니다!");
        }, 1000);
    }
}

// 게임 완료 모달 감지 및 확인 버튼 클릭
function checkForCompletionModal() {
    console.log("🎯 게임 완료 모달 검색 시작...");
    updateAutoStatus("6단계", "게임 완료 모달 검색 중...");

    let attempts = 0;
    const maxAttempts = 10; // 10초간 시도

    const checkModal = () => {
        attempts++;
        console.log(`🔍 모달 검색 시도 ${attempts}/${maxAttempts}`);
        updateAutoStatus("6단계", `모달 검색 시도 ${attempts}/${maxAttempts}`);

        // 1. 정확한 셀렉터로 모달 찾기
        const modal = document.querySelector('.lui-modal__body');
        if (modal) {
            console.log("✅ lui-modal__body 발견!");

            // CLEAR 타이틀 확인
            const title = modal.querySelector('.lui-modal__title');
            if (title && title.textContent.includes('CLEAR')) {
                console.log("✅ CLEAR 타이틀 확인!");

                // 경품 응모 텍스트 확인
                const content = modal.querySelector('.popup_text');
                if (content && content.textContent.includes('경품 응모권이 지급되었습니다')) {
                    console.log("✅ 게임 완료 모달 확인됨!");
                    updateAutoStatus("6단계", "게임 완료! 확인 버튼 클릭 중...");

                    // 확인 버튼 클릭
                    clickConfirmButton(modal);
                    return;
                }
            }
        }

        // 2. 대안적인 방법으로 모달 찾기
        const altModals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="dialog"]');
        for (const altModal of altModals) {
            const text = altModal.textContent || altModal.innerText;
            if (text.includes('CLEAR') && text.includes('경품 응모권')) {
                console.log("✅ 대안 방법으로 게임 완료 모달 발견!");
                clickConfirmButton(altModal);
                return;
            }
        }

        // 3. 더 광범위한 검색
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
            const text = element.textContent || element.innerText;
            if (text.includes('CLEAR') && text.includes('경품 응모권이 지급되었습니다')) {
                console.log("✅ 광범위 검색으로 게임 완료 메시지 발견!");

                // 해당 요소의 부모들 중에서 모달 찾기
                let parent = element.parentElement;
                while (parent) {
                    if (parent.querySelector('button') || parent.classList.contains('modal') || parent.classList.contains('popup')) {
                        clickConfirmButton(parent);
                        return;
                    }
                    parent = parent.parentElement;
                }
            }
        }

        // 재시도
        if (attempts < maxAttempts) {
            console.log(`⏳ 모달을 찾지 못했습니다. ${attempts + 1}초 후 재시도...`);
            setTimeout(checkModal, 1000);
        } else {
            console.log("❌ 게임 완료 모달을 찾지 못했습니다. 수동으로 확인 버튼을 클릭해주세요.");

            // 마지막 시도: 화면에 있는 모든 확인/닫기 버튼 찾기
            const allButtons = document.querySelectorAll('button');
            for (const btn of allButtons) {
                const btnText = btn.textContent || btn.innerText;
                if (btnText.includes('확인') || btnText.includes('닫기') || btnText.includes('OK') || btnText.includes('Close')) {
                    console.log(`🔍 가능한 확인 버튼 발견: "${btnText}"`);
                }
            }
        }
    };

    // 검색 시작 (1초 후)
    setTimeout(checkModal, 1000);
}

// 확인 버튼 클릭 함수
function clickConfirmButton(modalElement) {
    console.log("🎯 확인 버튼 검색 중...", modalElement);

    // 1. 정확한 클래스로 확인 버튼 찾기
    let confirmBtn = modalElement.querySelector('.lui-modal__confirm');

    if (confirmBtn) {
        console.log("✅ lui-modal__confirm 버튼 발견!");
    } else {
        // 2. 대안적인 방법들
        const buttonSelectors = [
            'button[class*="confirm"]',
            'button[class*="ok"]',
            '.modal button',
            '.popup button',
            'button:contains("확인")',
            'button:contains("OK")',
            'button:contains("닫기")'
        ];

        for (const selector of buttonSelectors) {
            confirmBtn = modalElement.querySelector(selector);
            if (confirmBtn) {
                console.log(`✅ ${selector}로 버튼 발견!`);
                break;
            }
        }
    }

    // 3. 텍스트로 버튼 찾기
    if (!confirmBtn) {
        const allButtons = modalElement.querySelectorAll('button');
        for (const btn of allButtons) {
            const btnText = btn.textContent || btn.innerText;
            if (btnText.includes('확인') || btnText.includes('OK') || btnText.includes('닫기')) {
                confirmBtn = btn;
                console.log(`✅ 텍스트 "${btnText}"로 확인 버튼 발견!`);
                break;
            }
        }
    }

    if (confirmBtn) {
        console.log("🎯 확인 버튼 클릭 시작...");

        // 여러 방법으로 클릭 시도
        setTimeout(() => {
            try {
                // 방법 1: 직접 클릭
                confirmBtn.click();
                console.log("✅ 확인 버튼 click() 성공");
            } catch (e) {
                console.log("⚠️ click() 실패:", e);
            }

            // 방법 2: 마우스 이벤트
            try {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                confirmBtn.dispatchEvent(clickEvent);
                console.log("✅ 확인 버튼 마우스 이벤트 성공");
            } catch (e) {
                console.log("⚠️ 마우스 이벤트 실패:", e);
            }

            // 방법 3: 포커스 후 엔터
            try {
                confirmBtn.focus();
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13
                });
                confirmBtn.dispatchEvent(enterEvent);
                console.log("✅ 확인 버튼 엔터 키 성공");
            } catch (e) {
                console.log("⚠️ 엔터 키 실패:", e);
            }

        }, 500); // 자연스러운 지연

    } else {
        console.log("❌ 확인 버튼을 찾을 수 없습니다.");
        console.log("모달 내부 모든 버튼들:");
        const allBtns = modalElement.querySelectorAll('button');
        allBtns.forEach((btn, index) => {
            console.log(`  버튼 ${index}: "${btn.textContent}" (class: ${btn.className})`);
        });
    }
}

// 카드 내용 추출 함수 (Lost Ark 게임에 최적화)
function getCardContent(card) {
    // 1. 이미지 소스 확인 (가장 확실한 식별자)
    const img = card.querySelector('img');
    if (img && img.src) {
        // URL에서 파일명만 추출 (예: card_001.png)
        const urlParts = img.src.split('/');
        const filename = urlParts[urlParts.length - 1];
        console.log(`🖼️ 카드 이미지: ${filename}`);
        return filename;
    }

    // 2. 데이터 속성 확인 (Lost Ark 특화)
    const dataAttrs = ['data-card-id', 'data-value', 'data-card', 'data-id', 'data-idx'];
    for (const attr of dataAttrs) {
        const value = card.getAttribute(attr);
        if (value) {
            console.log(`📋 데이터 속성 ${attr}: ${value}`);
            return `${attr}-${value}`;
        }
    }

    // 3. 카드 배경 이미지 확인
    const computedStyle = window.getComputedStyle(card);
    const backgroundImage = computedStyle.backgroundImage;
    if (backgroundImage && backgroundImage !== 'none') {
        const urlMatch = backgroundImage.match(/url\("?([^"]*)"?\)/);
        if (urlMatch) {
            const bgUrl = urlMatch[1];
            const bgFilename = bgUrl.split('/').pop();
            console.log(`🎨 배경 이미지: ${bgFilename}`);
            return `bg-${bgFilename}`;
        }
    }

    // 4. 텍스트 내용 확인
    const text = card.textContent || card.innerText;
    if (text && text.trim() && text.trim() !== '') {
        const cleanText = text.trim().replace(/\s+/g, '-');
        console.log(`📝 텍스트 내용: ${cleanText}`);
        return `text-${cleanText}`;
    }

    // 5. 클래스명에서 카드 정보 추출
    const className = card.className;
    const cardPatterns = [
        /card-(\w+)/,           // card-fire, card-water 등
        /type-(\w+)/,           // type-fire, type-water 등  
        /element-(\w+)/,        // element-fire 등
        /(\w+)-card/            // fire-card 등
    ];

    for (const pattern of cardPatterns) {
        const match = className.match(pattern);
        if (match) {
            console.log(`🏷️ 클래스 패턴: ${match[0]}`);
            return match[0];
        }
    }

    // 6. 카드 위치 기반 고유 식별자 (최후 수단)
    const parent = card.parentNode;
    if (parent) {
        const siblings = Array.from(parent.children);
        const cardIndex = siblings.indexOf(card);
        const rect = card.getBoundingClientRect();
        const positionId = `pos-${cardIndex}-${Math.round(rect.left)}-${Math.round(rect.top)}`;
        console.log(`📍 위치 기반 ID: ${positionId}`);
        return positionId;
    }

    // 7. 기본값 (매우 드문 경우)
    const timestamp = Date.now();
    const randomId = `unknown-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
    console.log(`❓ 기본 식별자: ${randomId}`);
    return randomId;
}

// 자동 매칭 시작
function startAutomaticMatching() {
    console.log("🎯 자동 매칭 시작!");

    // 기존 자동 클릭 함수 호출 (완전 자동 모드로 강제 설정)
    const gameCards = findGameCardElements();
    if (!gameCards) {
        console.log("❌ 게임 카드를 찾을 수 없습니다.");
        return;
    }

    // 매칭 가능한 카드 쌍 찾기
    const matchingPairs = findMatchingCardPairs();

    if (matchingPairs.length === 0) {
        console.log("❌ 현재 매칭 가능한 카드 쌍이 없습니다.");
        return;
    }

    console.log(`🎯 ${matchingPairs.length}개의 매칭 가능한 쌍을 발견했습니다!`);

    // 위험 모드로 강제 설정하여 완전 자동 실행
    console.log("⚠️ 완전 자동 모드 - 자동 클릭 시작!");
    playGameAutomatically(matchingPairs);
}

// 자동화 중단 함수
function stopFullAutoGame() {
    console.log("⏹️ 완전 자동화 중단 요청됨");

    // 전역 자동화 상태 중단
    if (window.__fullAutoState) {
        window.__fullAutoState.running = false;
        window.__fullAutoState.currentStep = 'stopped';
        console.log("✅ 자동화 상태 중단됨");
    }

    // 게임 상태 중단
    if (window.__gameState) {
        window.__gameState.gameCompleted = true;
        window.__gameState.isProcessing = false;
        console.log("✅ 게임 상태 중단됨");
    }

    // 자동화 상태 표시 업데이트
    updateAutoStatus("중단됨", "사용자가 자동화를 중단했습니다.");

    // 3초 후 상태 표시 제거
    setTimeout(() => {
        const statusDisplay = document.getElementById('autoStatusDisplay');
        if (statusDisplay) {
            statusDisplay.remove();
        }
    }, 3000);

    alert("✅ 자동화가 중단되었습니다!\n\n현재 진행 중인 작업이 있다면 곧 중단됩니다.");
}

// 단일 게임 실시간 매칭 함수 (우하단 UI 버튼용)
function startSingleGameMatching() {
    console.log("🎯 단일 게임 실시간 매칭 시작!");

    // 게임이 시작되었는지 확인
    const gameStarted = checkIfGameStarted();
    if (!gameStarted) {
        alert("❌ 게임이 아직 시작되지 않았습니다!\n\n해결 방법:\n1. '시작' 버튼을 먼저 클릭해서 게임을 시작하세요\n2. 카드들이 화면에 나타난 후 다시 시도하세요");
        return;
    }

    // 게임 카드 요소들이 있는지 확인
    const gameCards = findGameCardElements();
    if (!gameCards || gameCards.length === 0) {
        alert("❌ 게임 카드 요소를 찾을 수 없습니다!\n\n가능한 원인:\n1. 게임이 아직 완전히 로드되지 않음\n2. 게임 구조가 예상과 다름\n\n'디버그' 버튼으로 구조를 확인해주세요.");
        return;
    }

    console.log(`🎮 총 ${gameCards.length}개 카드로 단일 게임 실시간 매칭 시작`);

    // 확인 메시지
    const confirmation = confirm(
        `🧠 실시간 매칭 시스템을 시작합니다!\n\n` +
        `📋 동작 방식:\n` +
        `• 카드를 하나씩 클릭하여 내용 확인\n` +
        `• 매칭되는 카드를 즉시 찾아서 클릭\n` +
        `• 도전 기회를 절약하는 효율적 매칭\n\n` +
        `🎯 현재 게임: ${gameCards.length}개 카드 발견\n\n` +
        `시작하시겠습니까?`
    );

    if (!confirmation) {
        console.log("❌ 사용자가 실시간 매칭을 취소했습니다.");
        return;
    }

    // 🔄 게임 상태 초기화 (단일 게임용)
    resetGameState();

    // 🆕 새로운 단일 게임 상태 설정
    window.__singleGameState = {
        cardMemory: new Map(),
        isProcessing: false,
        gameCompleted: false,
        gameCards: gameCards,
        stepCount: 0
    };

    console.log("✅ 단일 게임 상태 초기화 완료!");

    // 단일 게임 진행 함수를 전역으로 정의
    window.__playSingleMove = function () {
        // 게임 상태 확인
        if (window.__singleGameState.isProcessing || window.__singleGameState.gameCompleted) {
            console.log("⏳ 이미 처리 중이거나 게임 완료됨");
            return;
        }

        // 무한 루프 방지
        window.__singleGameState.stepCount++;

        if (window.__singleGameState.stepCount > 50) {
            console.log("⚠️ 최대 단계 수 초과 - 무한 루프 방지로 중단");
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        window.__singleGameState.isProcessing = true;
        console.log(`🔄 단일 게임 단계 ${window.__singleGameState.stepCount}/50 시작...`);

        // 경품 응모권 모달 확인 (매 단계마다 확인)
        const prizeModalCheck = checkAllCardsMatched();
        if (prizeModalCheck) {
            console.log("🎉 단일 게임 - 경품 응모권 지급 모달 발견! 게임 완료!");
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        // 최소 진행 조건 확인 (경품 모달이 없으면 계속 진행)
        if (window.__singleGameState.stepCount >= 5) {
            console.log(`⏳ 단일 게임 단계 ${window.__singleGameState.stepCount}: 경품 모달 대기 중... (카드 기억: ${window.__singleGameState.cardMemory.size}개)`);
        }

        // 현재 카드 상태 확인
        const currentGameCards = findGameCardElements();
        if (!currentGameCards || currentGameCards.length === 0) {
            console.log("❌ 게임 카드가 사라짐 - 게임 완료로 간주");
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        // 1단계: 기억된 매칭 쌍 확인
        const knownMatch = findKnownMatchSingle(window.__singleGameState.cardMemory);
        if (knownMatch) {
            console.log(`💡 기억된 매칭 쌍 발견: 카드 ${knownMatch[0]} ↔ ${knownMatch[1]}`);
            window.__singleGameState.isProcessing = false;
            executeKnownMatchSingle(knownMatch[0], knownMatch[1]);
            return;
        }

        // 2단계: 새로운 카드 탐색
        const nextUnknownCard = findNextUnknownCardSingle(window.__singleGameState.cardMemory, currentGameCards);
        if (nextUnknownCard === -1) {
            console.log("❓ 더 이상 탐색할 카드가 없습니다.");

            // 경품 모달 마지막 확인
            const finalPrizeCheck = checkAllCardsMatched();
            if (finalPrizeCheck) {
                console.log("🎉 단일 게임 - 마지막 확인에서 경품 모달 발견! 게임 완료!");
                window.__singleGameState.gameCompleted = true;
                showSingleGameComplete();
                return;
            }

            // 모든 카드를 확인했지만 경품 모달이 나타나지 않음 - 정지
            const totalCards = currentGameCards.length;
            const knownCards = window.__singleGameState.cardMemory.size;

            console.log(`📊 단일 게임 - 총 카드: ${totalCards}개, 기억된 카드: ${knownCards}개`);

            if (knownCards >= totalCards - 2) {
                console.log("⚠️ 단일 게임 - 거의 모든 카드를 확인했으나 경품 모달 없음 - 매칭 실패로 게임 정지");
                window.__singleGameState.gameCompleted = true;

                // 매칭 실패 알림 (단일 게임용)
                setTimeout(() => {
                    console.log("❌ 단일 게임 매칭 실패 - 경품 응모권이 지급되지 않았습니다.");
                    console.log("🛑 단일 게임을 정지합니다. 수동으로 게임을 확인해주세요.");
                    alert("❌ 매칭 실패!\n\n경품 응모권이 지급되지 않았습니다.\n수동으로 게임을 확인해주세요.");
                }, 1000);
                return;
            }

            // 3초 대기 후 한 번 더 확인
            window.__singleGameState.isProcessing = false;
            console.log("⏳ 단일 게임 - 3초 후 경품 모달 재확인...");
            setTimeout(() => {
                if (!window.__singleGameState.gameCompleted) {
                    const retryPrizeCheck = checkAllCardsMatched();
                    if (retryPrizeCheck) {
                        window.__singleGameState.gameCompleted = true;
                        showSingleGameComplete();
                    } else {
                        console.log("⚠️ 단일 게임 - 경품 모달이 나타나지 않음 - 게임 정지");
                        window.__singleGameState.gameCompleted = true;
                        alert("⚠️ 게임 정지!\n\n경품 모달이 나타나지 않아 게임을 정지합니다.");
                    }
                }
            }, 3000);
            return;
        }

        console.log(`🔍 새 카드 ${nextUnknownCard} 탐색 중...`);

        // 카드 클릭하여 내용 확인
        setTimeout(() => {
            console.log(`🎯 카드 ${nextUnknownCard} 클릭 시도 중...`);
            clickGameCardNaturally(nextUnknownCard);

            // 카드 내용 읽기 대기
            setTimeout(() => {
                const cardContent = getCardContent(currentGameCards[nextUnknownCard]);
                window.__singleGameState.cardMemory.set(nextUnknownCard, cardContent);
                console.log(`📝 카드 ${nextUnknownCard} 기억됨: ${cardContent}`);

                // 즉시 매칭 쌍 검사
                const immediateMatch = findImmediateMatchSingle(nextUnknownCard, cardContent, window.__singleGameState.cardMemory);

                if (immediateMatch !== -1) {
                    console.log(`⚡ 즉시 매칭 발견! 카드 ${nextUnknownCard} ↔ ${immediateMatch}`);

                    // 매칭 쌍 즉시 클릭
                    setTimeout(() => {
                        console.log(`🎯 매칭 카드 ${immediateMatch} 클릭 시도 중...`);
                        clickGameCardNaturally(immediateMatch);

                        // 매칭 완료 후 다음 단계
                        setTimeout(() => {
                            window.__singleGameState.isProcessing = false;
                            console.log("✅ 즉시 매칭 완료! 다음 단계 진행...");
                            setTimeout(() => {
                                if (window.__playSingleMove && !window.__singleGameState.gameCompleted) {
                                    window.__playSingleMove();
                                }
                            }, 1500);
                        }, 1500);

                    }, 800 + Math.random() * 400);

                } else {
                    // 매칭되지 않음 - 다음 단계 진행
                    console.log("❌ 현재 카드는 매칭되지 않음. 계속 탐색...");
                    setTimeout(() => {
                        window.__singleGameState.isProcessing = false;
                        if (window.__playSingleMove && !window.__singleGameState.gameCompleted) {
                            window.__playSingleMove();
                        }
                    }, 1000 + Math.random() * 500);
                }

            }, 1000); // 카드 내용 읽기 시간

        }, 400 + Math.random() * 200);
    };

    // 단일 게임 시작
    console.log("🎯 단일 게임 실시간 매칭 시작!");
    alert("🎮 실시간 매칭이 시작됩니다!\n\n콘솔(F12)에서 진행 상황을 확인할 수 있습니다.");

    // 게임 시작
    setTimeout(() => {
        window.__playSingleMove();
    }, 1000);
}

// 단일 게임용 헬퍼 함수들
function findKnownMatchSingle(cardMemory) {
    const knownCards = Array.from(cardMemory.entries());

    for (let i = 0; i < knownCards.length; i++) {
        for (let j = i + 1; j < knownCards.length; j++) {
            const [index1, content1] = knownCards[i];
            const [index2, content2] = knownCards[j];

            if (content1 === content2 && !isCardMatched(index1) && !isCardMatched(index2)) {
                return [index1, index2];
            }
        }
    }

    return null;
}

function findImmediateMatchSingle(newCardIndex, newCardContent, cardMemory) {
    for (const [index, content] of cardMemory.entries()) {
        if (index !== newCardIndex && content === newCardContent && !isCardMatched(index)) {
            return index;
        }
    }
    return -1;
}

function findNextUnknownCardSingle(cardMemory, gameCards) {
    for (let i = 0; i < gameCards.length; i++) {
        if (!cardMemory.has(i) && !isCardMatched(i)) {
            return i;
        }
    }
    return -1;
}

function executeKnownMatchSingle(index1, index2) {
    console.log(`🎯 확실한 매칭 실행: ${index1} ↔ ${index2}`);

    setTimeout(() => {
        clickGameCardNaturally(index1);

        setTimeout(() => {
            clickGameCardNaturally(index2);

            setTimeout(() => {
                console.log("✅ 확실한 매칭 완료!");
                if (window.__playSingleMove && !window.__singleGameState.gameCompleted) {
                    setTimeout(() => window.__playSingleMove(), 1500);
                }
            }, 1000);

        }, 800 + Math.random() * 400);

    }, 400 + Math.random() * 200);
}

function showSingleGameComplete() {
    console.log("🎉🎉🎉 단일 게임 실시간 매칭 완료! 🎉🎉🎉");

    // 상태 정리
    if (window.__singleGameState) {
        delete window.__singleGameState;
    }
    if (window.__playSingleMove) {
        delete window.__playSingleMove;
    }

    setTimeout(() => {
        alert("🎉 축하합니다!\n\n실시간 매칭 시스템으로 게임을 완료했습니다!\n\n🧠 도전 기회를 절약하면서 효율적으로 모든 카드를 매칭했습니다.");
    }, 1000);
}

// 즉시 실행
runCardMemoHelper();