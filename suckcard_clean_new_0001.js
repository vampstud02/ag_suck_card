/**
 * ====================================================================================================
 * Lost Ark 카드 메모리 게임 도우미 스크립트 - Refactored & Sound Enabled
 * ====================================================================================================
 * 
 * 주요 기능:
 * 1. 실시간 매칭 (단일 게임)
 * 2. 완전 자동화 (연속 게임)
 * 3. 경품 모달 기반 완료 감지
 * 4. 카드 메모리 UI
 * 5. 사운드 알림 (완료/중단 시)
 */

// ====================================================================================================
// 1. 중복 설치 방지 및 초기화
// ====================================================================================================

function initializeCardMemoHelper() {
    if (window.__cardMemoInstalled) {
        alert("카드 미리보기 스크립트가 이미 설치되어 있습니다.");
        return;
    }

    window.__cardMemoInstalled = true;
    window.__cardMemo = window.__cardMemo || {};
    window.__cardDone = [];

    // 오디오 컨텍스트 초기화 (사용자 상호작용 후 활성화됨)
    window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    console.log("카드 메모리 도우미 초기화 완료");
}

// ====================================================================================================
// 2. 사운드 알림 시스템
// ====================================================================================================

function playSound(type) {
    if (!window.__audioCtx) return;

    // 오디오 컨텍스트가 suspended 상태라면 resume 시도 (사용자 인터랙션 필요)
    if (window.__audioCtx.state === 'suspended') {
        window.__audioCtx.resume().catch(e => console.log("Audio resume failed:", e));
    }

    const oscillator = window.__audioCtx.createOscillator();
    const gainNode = window.__audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(window.__audioCtx.destination);

    const now = window.__audioCtx.currentTime;

    if (type === 'success') {
        // 성공음: 띠링~ (High pitch ascending)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // C6

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    } else if (type === 'stop' || type === 'error') {
        // 중단/에러음: 띠~ (Low pitch descending)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(196.00, now); // G3
        oscillator.frequency.linearRampToValueAtTime(130.81, now + 0.3); // C3

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    } else if (type === 'click') {
        // 클릭음: 톡
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
}

// ====================================================================================================
// 3. UI 패널 생성
// ====================================================================================================

function createMainPanel() {
    const container = document.createElement("div");
    container.id = "card-memo-container";
    applyContainerStyles(container);
    restorePanelPosition(container);
    return container;
}

function applyContainerStyles(container) {
    Object.assign(container.style, {
        position: "fixed",
        right: "12px",
        bottom: "12px",
        zIndex: 2147483647,
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(0,0,0,0.2)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
        fontFamily: "Segoe UI, Roboto, Arial, sans-serif",
        fontSize: "12px",
        color: "#111",
        userSelect: "none"
    });
}

function restorePanelPosition(container) {
    const savedSettings = sessionStorage.getItem("__cardMemoPanel");
    let panelSettings = { left: null, top: null, scale: 1 };

    if (savedSettings) {
        try {
            panelSettings = JSON.parse(savedSettings);
        } catch (error) {
            console.warn("저장된 패널 설정 파싱 실패:", error);
        }
    }

    if (panelSettings.left !== null && panelSettings.top !== null) {
        container.style.left = panelSettings.left + "px";
        container.style.top = panelSettings.top + "px";
        container.style.right = "auto";
        container.style.bottom = "auto";
    }

    if (panelSettings.scale !== 1) {
        container.style.transform = `scale(${panelSettings.scale})`;
    }

    return panelSettings;
}

// ====================================================================================================
// 4. 헤더 및 컨트롤 버튼 생성
// ====================================================================================================

function createHeader() {
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.marginBottom = "6px";
    header.style.cursor = "move";

    const title = document.createElement("div");
    title.textContent = "카드 메모리 게임";
    title.style.fontWeight = "600";
    title.style.marginRight = "8px";

    const buttonContainer = document.createElement("div");

    // 버튼 생성 헬퍼
    const createBtn = (text, color, onClick, titleText) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.title = titleText || text;
        Object.assign(btn.style, {
            padding: "4px 6px",
            fontSize: "11px",
            cursor: "pointer",
            marginLeft: "6px",
            backgroundColor: color || "",
            color: color ? "white" : "",
            border: "none",
            borderRadius: "3px"
        });
        btn.addEventListener("click", onClick);
        return btn;
    };

    const autoClickButton = createBtn("실시간 매칭", "#4CAF50", startSingleGameMatching, "실시간 매칭 시스템으로 1회 게임 플레이");
    const debugButton = createBtn("디버그", "#FF9800", debugGameStructure, "게임 구조 분석");
    const resetButton = createBtn("초기화", null, () => {
        if (confirm("저장된 카드 정보를 모두 삭제하시겠습니까?")) {
            window.__cardDone = [];
            window.__cardMemo = {};
            updateCardDisplay();
            console.log("카드 메모리 완전 초기화 완료");
        }
    }, "기억한 카드 초기화");

    // 사운드 테스트 버튼
    const soundButton = createBtn("🔊", null, () => {
        playSound('success');
        setTimeout(() => playSound('stop'), 600);
    }, "사운드 테스트");

    const closeButton = createBtn("×", null, () => {
        const container = document.getElementById("card-memo-container");
        if (container) container.style.display = "none";
    }, "닫기 (UI만 숨김)");
    closeButton.style.fontSize = "14px";
    closeButton.style.padding = "2px 6px";

    buttonContainer.appendChild(autoClickButton);
    buttonContainer.appendChild(debugButton);
    buttonContainer.appendChild(resetButton);
    buttonContainer.appendChild(soundButton);
    buttonContainer.appendChild(closeButton);

    header.appendChild(title);
    header.appendChild(buttonContainer);

    return header;
}

// ====================================================================================================
// 5. 카드 그리드 및 UI 로직
// ====================================================================================================

function createCardGrid() {
    const grid = document.createElement("div");
    grid.id = "card-memo-grid";
    Object.assign(grid.style, {
        display: "grid",
        gridTemplateColumns: "repeat(6, 63px)",
        gridTemplateRows: "repeat(3, 84px)",
        gap: "6px",
        transition: "transform 0.1s",
        transformOrigin: "top left"
    });

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

    const cardImage = document.createElement("img");
    Object.assign(cardImage.style, {
        maxWidth: "100%",
        maxHeight: "100%",
        display: "none"
    });

    slot.appendChild(cardImage);
    return slot;
}

function createResizeHandle() {
    const handle = document.createElement("div");
    Object.assign(handle.style, {
        position: "absolute",
        left: "0",
        top: "0",
        width: "12px",
        height: "12px",
        cursor: "nwse-resize",
        background: "rgba(0,0,0,0.2)",
        borderTopLeftRadius: "8px"
    });
    return handle;
}

function updateCardDisplay() {
    const cardSlots = document.querySelectorAll('.card-memo-slot');
    const imageGroups = {};
    const colorPalette = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FF8000', '#8000FF', '#00FF80', '#FF0080'
    ];

    for (let i = 0; i < 18; i++) {
        if (window.__cardMemo[i] && !window.__cardDone.includes(i)) {
            const imageUrl = window.__cardMemo[i];
            if (!imageGroups[imageUrl]) imageGroups[imageUrl] = [];
            imageGroups[imageUrl].push(i);
        }
    }

    let colorIndex = 0;
    const cardColors = {};
    Object.entries(imageGroups).forEach(([imageUrl, indices]) => {
        if (indices.length === 2) {
            const color = colorPalette[colorIndex % colorPalette.length];
            indices.forEach(index => cardColors[index] = color);
            colorIndex++;
        }
    });

    for (let i = 0; i < 18; i++) {
        const cardImageUrl = window.__cardMemo[i];
        const slot = cardSlots[i];
        const image = slot.querySelector('img');

        if (cardImageUrl) {
            image.src = cardImageUrl;
            image.style.display = "block";
            slot.style.background = "#fff";
            slot.style.borderStyle = "solid";

            if (window.__cardDone.includes(i)) {
                image.style.filter = "grayscale(100%)";
                image.style.opacity = "0.2";
                slot.style.border = "1px solid #ccc";
                slot.style.boxShadow = "none";
                slot.style.backgroundColor = "#fff";
            } else {
                image.style.removeProperty("filter");
                image.style.removeProperty("opacity");

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
// 6. 드래그 및 크기 조절
// ====================================================================================================

function setupDragFunctionality(container, header) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    header.addEventListener("mousedown", (event) => {
        isDragging = true;
        dragOffsetX = event.clientX - container.offsetLeft;
        dragOffsetY = event.clientY - container.offsetTop;
        document.body.style.userSelect = "none";
    });

    window.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            savePanelSettings(container);
        }
        document.body.style.userSelect = "";
    });

    window.addEventListener("mousemove", (event) => {
        if (!isDragging) return;
        container.style.left = (event.clientX - dragOffsetX) + "px";
        container.style.top = (event.clientY - dragOffsetY) + "px";
        container.style.right = "auto";
        container.style.bottom = "auto";
    });
}

function setupResizeFunctionality(container, resizeHandle, currentSettings) {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startScale = currentSettings.scale;

    resizeHandle.addEventListener("mousedown", (event) => {
        event.preventDefault();
        isResizing = true;
        startX = event.clientX;
        startY = event.clientY;
        startScale = currentSettings.scale;
    });

    window.addEventListener("mouseup", () => {
        if (isResizing) {
            isResizing = false;
            savePanelSettings(container, currentSettings);
        }
    });

    window.addEventListener("mousemove", (event) => {
        if (!isResizing) return;
        const deltaX = startX - event.clientX;
        const deltaY = startY - event.clientY;
        const scaleDelta = (deltaX + deltaY) / 400;
        let newScale = Math.min(Math.max(0.5, startScale + scaleDelta), 3);
        currentSettings.scale = newScale;
        container.style.transform = `scale(${newScale})`;
    });
}

function savePanelSettings(container, currentSettings = null) {
    const settings = {
        left: container.offsetLeft,
        top: container.offsetTop,
        scale: currentSettings ? currentSettings.scale : 1
    };
    sessionStorage.setItem("__cardMemoPanel", JSON.stringify(settings));
}

// ====================================================================================================
// 7. 네트워크 요청 감지
// ====================================================================================================

function interceptNetworkRequests() {
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function CustomXHR() {
        const xhr = new originalXHR();
        let requestUrl = null;
        let requestMethod = null;
        let requestData = null;

        const originalOpen = xhr.open;
        xhr.open = function (method, url) {
            requestMethod = method;
            requestUrl = url;
            return originalOpen.apply(xhr, arguments);
        };

        const originalSend = xhr.send;
        xhr.send = function (data) {
            requestData = data;
            xhr.addEventListener("load", function () {
                try {
                    processCardResponse(requestUrl, requestMethod, requestData, xhr.responseText);
                } catch (error) {
                    console.error("카드 응답 처리 중 오류:", error);
                }
            });
            return originalSend.apply(xhr, arguments);
        };

        CustomXHR.prototype = originalXHR.prototype;
        return xhr;
    };
}

function processCardResponse(url, method, requestData, responseText) {
    if (!url) return;
    const apiUrl = new URL(url, location.href);
    if (!apiUrl.pathname.endsWith("/Promotion/Card/GetCard251105")) return;
    if (!method || method.toUpperCase() !== "POST") return;

    let cardIndex = null;
    if (typeof requestData === "string") {
        const match = requestData.match(/(?:^|&)index=([^&]+)/);
        if (match) cardIndex = decodeURIComponent(match[1]);
    } else if (requestData instanceof FormData || requestData instanceof URLSearchParams) {
        cardIndex = requestData.get("index");
    }

    if (!responseText) return;

    try {
        const response = JSON.parse(responseText);
        if (response) {
            if (response.img != null) {
                const index = cardIndex != null ? Number(cardIndex) : null;
                if (index !== null && !Number.isNaN(index) && index >= 0 && index < 18) {
                    window.__cardMemo[index] = new URL(response.img, "https://cdn-lostark.game.onstove.com").href;
                }
            }
            if (response.isMatch && response.index) {
                window.__cardDone = [...window.__cardDone, ...response.index];
            }
            if (response.complete) {
                window.__cardDone = [];
                window.__cardMemo = {};
            }
        }
        updateCardDisplay();
    } catch (error) {
        console.error("카드 응답 파싱 오류:", error);
    }
}

// ====================================================================================================
// 8. 게임 로직 및 자동화 (Refactored)
// ====================================================================================================

// 공통: 매칭 가능한 카드 쌍 찾기
function findMatchingCardPairs() {
    const pairs = [];
    const imageGroups = {};

    for (let i = 0; i < 18; i++) {
        if (window.__cardMemo[i] && !window.__cardDone.includes(i)) {
            const imageUrl = window.__cardMemo[i];
            if (!imageGroups[imageUrl]) imageGroups[imageUrl] = [];
            imageGroups[imageUrl].push(i);
        }
    }

    Object.values(imageGroups).forEach(indices => {
        if (indices.length === 2) pairs.push(indices);
    });

    return pairs;
}

// 공통: 모든 매칭 가능한 카드 쌍 찾기 (안전 점검용)
function findAllKnownMatches(cardMemory) {
    const matches = [];
    const knownCards = Array.from(cardMemory.entries());
    const usedIndices = new Set();

    for (let i = 0; i < knownCards.length; i++) {
        for (let j = i + 1; j < knownCards.length; j++) {
            const [index1, content1] = knownCards[i];
            const [index2, content2] = knownCards[j];

            if (usedIndices.has(index1) || usedIndices.has(index2)) continue;

            if (content1 === content2 && !isCardMatched(index1) && !isCardMatched(index2)) {
                matches.push([index1, index2]);
                usedIndices.add(index1);
                usedIndices.add(index2);
            }
        }
    }
    return matches;
}

// 공통: 기억된 카드 중 매칭 가능한 쌍 찾기
function findKnownMatchCommon(cardMemory) {
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

// 공통: 즉시 매칭 쌍 찾기
function findImmediateMatchCommon(newCardIndex, newCardContent, cardMemory) {
    for (const [index, content] of cardMemory.entries()) {
        if (index !== newCardIndex && content === newCardContent && !isCardMatched(index)) {
            return index;
        }
    }
    return -1;
}

// 공통: 다음 탐색할 미지의 카드 찾기
function findNextUnknownCardCommon(cardMemory, gameCards) {
    for (let i = 0; i < gameCards.length; i++) {
        if (!cardMemory.has(i) && !isCardMatched(i)) {
            return i;
        }
    }
    return -1;
}

// 공통: 확실한 매칭 실행 (안전한 버전)
function executeKnownMatchSafe(index1, index2, nextMoveCallback) {
    console.log(`🎯 확실한 매칭 실행: ${index1} ↔ ${index2}`);
    setTimeout(() => {
        clickGameCardNaturally(index1);
        setTimeout(() => {
            clickGameCardNaturally(index2);
            setTimeout(() => {
                console.log("✅ 확실한 매칭 완료!");
                if (nextMoveCallback) setTimeout(nextMoveCallback, 1500);
            }, 1000);
        }, 800 + Math.random() * 400);
    }, 400 + Math.random() * 200);
}

// 단일 게임 실시간 매칭 시작
function startSingleGameMatching() {
    console.log("🎯 단일 게임 실시간 매칭 시작!");

    if (!checkIfGameStarted()) {
        alert("❌ 게임이 아직 시작되지 않았습니다!\n\n해결 방법:\n1. '시작' 버튼을 먼저 클릭해서 게임을 시작하세요\n2. 카드들이 화면에 나타난 후 다시 시도하세요");
        return;
    }

    const gameCards = findGameCardElements();
    if (!gameCards || gameCards.length === 0) {
        alert("❌ 게임 카드 요소를 찾을 수 없습니다!\n\n가능한 원인:\n1. 게임이 아직 완전히 로드되지 않음\n2. 게임 구조가 예상과 다름\n\n'디버그' 버튼으로 구조를 확인해주세요.");
        return;
    }

    if (!confirm(`🧠 실시간 매칭 시스템을 시작합니다!\n\n🎯 현재 게임: ${gameCards.length}개 카드 발견\n\n시작하시겠습니까?`)) {
        return;
    }

    resetGameState();
    window.__singleGameState = {
        cardMemory: new Map(),
        isProcessing: false,
        gameCompleted: false,
        gameCards: gameCards,
        stepCount: 0
    };

    window.__playSingleMove = function () {
        if (window.__singleGameState.isProcessing || window.__singleGameState.gameCompleted) return;

        window.__singleGameState.stepCount++;
        if (window.__singleGameState.stepCount > 50) {
            console.log("⚠️ 최대 단계 수 초과 - 중단");
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        window.__singleGameState.isProcessing = true;
        console.log(`🔄 단일 게임 단계 ${window.__singleGameState.stepCount}/50 시작...`);

        if (checkAllCardsMatched()) {
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        const currentGameCards = findGameCardElements();
        if (!currentGameCards || currentGameCards.length === 0) {
            window.__singleGameState.gameCompleted = true;
            showSingleGameComplete();
            return;
        }

        // 0. 안전 장치: 확실한 매칭이 너무 많이 쌓여있는지 확인
        const allKnownMatches = findAllKnownMatches(window.__singleGameState.cardMemory);
        if (allKnownMatches.length >= 3) {
            console.log(`⚠️ 안전 경고: 확실한 매칭이 ${allKnownMatches.length}개나 쌓여있습니다. (매칭 실패 의심)`);
            window.__singleGameState.gameCompleted = true;
            playSound('error');
            alert(`⚠️ 안전을 위해 정지합니다!\n\n확실한 매칭이 ${allKnownMatches.length}개 이상 쌓여있습니다.\n클릭이 제대로 되지 않거나 게임 상태가 꼬인 것 같습니다.`);
            return;
        }

        // 1. 기억된 매칭
        const knownMatch = findKnownMatchCommon(window.__singleGameState.cardMemory);
        if (knownMatch) {
            window.__singleGameState.isProcessing = false;
            executeKnownMatchSafe(knownMatch[0], knownMatch[1], () => {
                if (!window.__singleGameState.gameCompleted) window.__playSingleMove();
            });
            return;
        }

        // 2. 새로운 카드 탐색
        const nextUnknownCard = findNextUnknownCardCommon(window.__singleGameState.cardMemory, currentGameCards);
        if (nextUnknownCard === -1) {
            // 모든 카드 확인됨
            if (checkAllCardsMatched()) {
                window.__singleGameState.gameCompleted = true;
                showSingleGameComplete();
            } else {
                // 매칭 실패 상황
                const knownCards = window.__singleGameState.cardMemory.size;
                if (knownCards >= currentGameCards.length - 2) {
                    window.__singleGameState.gameCompleted = true;
                    playSound('error'); // 에러 사운드
                    alert("❌ 매칭 실패!\n\n경품 응모권이 지급되지 않았습니다.\n수동으로 게임을 확인해주세요.");
                } else {
                    // 잠시 대기 후 재시도
                    window.__singleGameState.isProcessing = false;
                    setTimeout(() => {
                        if (!window.__singleGameState.gameCompleted) {
                            if (checkAllCardsMatched()) {
                                window.__singleGameState.gameCompleted = true;
                                showSingleGameComplete();
                            } else {
                                window.__singleGameState.gameCompleted = true;
                                playSound('stop'); // 중단 사운드
                                alert("⚠️ 게임 정지!\n\n경품 모달이 나타나지 않아 게임을 정지합니다.");
                            }
                        }
                    }, 3000);
                }
            }
            return;
        }

        // 3. 카드 클릭 및 확인
        setTimeout(() => {
            clickGameCardNaturally(nextUnknownCard);
            setTimeout(() => {
                const cardContent = getCardContent(currentGameCards[nextUnknownCard]);
                window.__singleGameState.cardMemory.set(nextUnknownCard, cardContent);

                const immediateMatch = findImmediateMatchCommon(nextUnknownCard, cardContent, window.__singleGameState.cardMemory);
                if (immediateMatch !== -1) {
                    setTimeout(() => {
                        clickGameCardNaturally(immediateMatch);
                        setTimeout(() => {
                            window.__singleGameState.isProcessing = false;
                            if (!window.__singleGameState.gameCompleted) setTimeout(window.__playSingleMove, 1500);
                        }, 1500);
                    }, 800 + Math.random() * 400);
                } else {
                    setTimeout(() => {
                        window.__singleGameState.isProcessing = false;
                        if (!window.__singleGameState.gameCompleted) window.__playSingleMove();
                    }, 1000 + Math.random() * 500);
                }
            }, 1000);
        }, 400 + Math.random() * 200);
    };

    console.log("🎯 단일 게임 실시간 매칭 시작!");
    setTimeout(window.__playSingleMove, 1000);
}

function showSingleGameComplete() {
    console.log("🎉🎉🎉 단일 게임 실시간 매칭 완료! 🎉🎉🎉");
    if (window.__singleGameState) delete window.__singleGameState;
    if (window.__playSingleMove) delete window.__playSingleMove;

    playSound('success'); // 성공 사운드

    setTimeout(() => {
        alert("🎉 축하합니다!\n\n실시간 매칭 시스템으로 게임을 완료했습니다!");
    }, 1000);
}

// ====================================================================================================
// 9. 완전 자동화 (연속 게임)
// ====================================================================================================

function createFullAutoButton() {
    const existingButton = document.getElementById('fullAutoButton');
    if (existingButton) existingButton.remove();
    const existingStopButton = document.getElementById('stopAutoButton');
    if (existingStopButton) existingStopButton.remove();

    const fullAutoButton = document.createElement('button');
    fullAutoButton.id = 'fullAutoButton';
    fullAutoButton.textContent = '🤖 완전 자동 플레이';
    fullAutoButton.style.cssText = `
        position: fixed; top: 120px; right: 20px; z-index: 9999; padding: 15px 25px;
        background: linear-gradient(45deg, #FF6B6B, #4ECDC4); color: white; border: none;
        border-radius: 25px; cursor: pointer; font-weight: bold; font-size: 16px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s ease;
    `;

    const stopAutoButton = document.createElement('button');
    stopAutoButton.id = 'stopAutoButton';
    stopAutoButton.textContent = '⏹️ 자동화 중단';
    stopAutoButton.style.cssText = `
        position: fixed; top: 180px; right: 20px; z-index: 9999; padding: 10px 20px;
        background: #e74c3c; color: white; border: none; border-radius: 15px;
        cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        display: none;
    `;

    fullAutoButton.addEventListener('click', () => {
        startFullAutoGame();
        stopAutoButton.style.display = 'block';
        fullAutoButton.style.display = 'none';
    });

    stopAutoButton.addEventListener('click', () => {
        stopFullAutoGame();
        stopAutoButton.style.display = 'none';
        fullAutoButton.style.display = 'block';
    });

    document.body.appendChild(fullAutoButton);
    document.body.appendChild(stopAutoButton);
}

function startFullAutoGame() {
    if (!confirm("🤖 완전 자동 카드 게임을 시작합니다!\n\n토큰이 1개 남으면 자동 중단됩니다.")) return;

    window.__fullAutoState = { running: true, currentStep: 'start', tokenCount: null };
    updateAutoStatus("1단계", "게임 플레이 버튼 검색 중...");
    setTimeout(clickPlayButton, 1000);
}

function stopFullAutoGame() {
    console.log("⏹️ 완전 자동화 중단 요청됨");
    if (window.__fullAutoState) {
        window.__fullAutoState.running = false;
        window.__fullAutoState.currentStep = 'stopped';
    }
    if (window.__gameState) {
        window.__gameState.gameCompleted = true;
        window.__gameState.isProcessing = false;
    }
    updateAutoStatus("중단됨", "사용자가 자동화를 중단했습니다.");
    playSound('stop'); // 중단 사운드

    setTimeout(() => {
        const statusDisplay = document.getElementById('autoStatusDisplay');
        if (statusDisplay) statusDisplay.remove();
    }, 3000);

    alert("✅ 자동화가 중단되었습니다!");
}

// 자동화 단계별 함수들 (clickPlayButton, checkTokenConfirmModal 등)은 기존 로직 유지하되
// playSound 추가 및 리팩토링된 매칭 로직 사용

function clickPlayButton() {
    const playBtn = document.getElementById('playBtn') ||
        Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('게임 플레이') || b.textContent.includes('플레이'));

    if (playBtn) {
        setTimeout(() => {
            playBtn.click();
            window.__fullAutoState.currentStep = 'token_confirm';
            updateAutoStatus("2단계", "토큰 사용 확인 모달 대기 중...");
            setTimeout(checkTokenConfirmModal, 2000);
        }, 500);
    } else {
        alert("게임 플레이 버튼을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.");
        playSound('error');
    }
}

function checkTokenConfirmModal() {
    let attempts = 0;
    const checkModal = () => {
        attempts++;
        const modals = document.querySelectorAll('.lui-modal__content, [class*="modal"], [class*="popup"]');
        for (const modal of modals) {
            const text = modal.textContent || modal.innerText;
            if (text.includes('토큰을 사용하여') && text.includes('보유 중인 토큰')) {
                const tokenMatch = text.match(/보유 중인 토큰\s*:\s*.*?(\d+)개/);
                if (tokenMatch) {
                    const tokenCount = parseInt(tokenMatch[1]);
                    window.__fullAutoState.tokenCount = tokenCount;
                    updateAutoStatus("2단계", "토큰 사용 확인 모달 발견!", tokenCount);

                    if (tokenCount <= 1) {
                        updateAutoStatus("중단됨", `토큰이 ${tokenCount}개만 남았습니다.`, tokenCount);
                        window.__fullAutoState.running = false;
                        playSound('stop');
                        return;
                    }
                }

                const confirmBtn = findConfirmButtonInModal(modal);
                if (confirmBtn) {
                    setTimeout(() => {
                        confirmBtn.click();
                        window.__fullAutoState.currentStep = 'item_reward';
                        updateAutoStatus("3단계", "토큰 사용 확인 완료! 아이템 획득 모달 대기 중...");
                        setTimeout(checkItemRewardModal, 3000);
                    }, 800);
                }
                return;
            }
        }
        if (attempts < 10) setTimeout(checkModal, 1000);
        else {
            alert("토큰 사용 확인 창이 나타나지 않았습니다.");
            playSound('error');
        }
    };
    checkModal();
}

function checkItemRewardModal() {
    let attempts = 0;
    const checkModal = () => {
        attempts++;
        const modals = document.querySelectorAll('.lui-modal__body, [class*="modal"], [class*="popup"]');
        for (const modal of modals) {
            const text = modal.textContent || modal.innerText;
            if ((text.includes('아이템 획득') || text.includes('아이템이 지급')) &&
                (text.includes('상품함을 확인') || text.includes('지급 되었습니다'))) {

                const confirmBtn = findConfirmButtonInModal(modal);
                if (confirmBtn) {
                    setTimeout(() => {
                        confirmBtn.click();
                        window.__fullAutoState.currentStep = 'game_start';
                        updateAutoStatus("4단계", "아이템 획득 확인 완료! 게임 시작 대기 중...");
                        setTimeout(waitForGameStart, 3000);
                    }, 800);
                }
                return;
            }
        }
        if (attempts < 15) setTimeout(checkModal, 1000);
        else waitForGameStart(); // 바로 게임 시작됐을 수도 있음
    };
    checkModal();
}

function waitForGameStart() {
    let attempts = 0;
    const checkGameStart = () => {
        attempts++;
        if (checkIfGameStarted()) {
            resetGameState();
            window.__fullAutoState.currentStep = 'playing';
            updateAutoStatus("5단계", "실시간 자동 매칭 시작!");
            setTimeout(startRealTimeMatching, 2000);
        } else {
            if (attempts < 10) setTimeout(checkGameStart, 2000);
            else {
                alert("게임이 시작되지 않았습니다.");
                playSound('error');
            }
        }
    };
    checkGameStart();
}

function startRealTimeMatching() {
    resetGameState();
    const gameCards = findGameCardElements();
    if (!gameCards || gameCards.length === 0) {
        updateAutoStatus("5단계", "❌ 게임 카드를 찾을 수 없음");
        playSound('error');
        return;
    }

    window.__gameState = {
        cardMemory: new Map(),
        isProcessing: false,
        gameCompleted: false,
        gameCards: gameCards,
        stepCount: 0
    };

    window.__playNextMove = function () {
        if (window.__fullAutoState && !window.__fullAutoState.running) return;
        if (window.__gameState.isProcessing || window.__gameState.gameCompleted) return;

        window.__gameState.stepCount++;
        if (window.__gameState.stepCount > 50) {
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        window.__gameState.isProcessing = true;

        if (checkAllCardsMatched()) {
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        const currentGameCards = findGameCardElements();
        if (!currentGameCards || currentGameCards.length === 0) {
            window.__gameState.gameCompleted = true;
            showGameCompleteMessage();
            return;
        }

        // 0. 안전 장치: 확실한 매칭이 너무 많이 쌓여있는지 확인
        const allKnownMatches = findAllKnownMatches(window.__gameState.cardMemory);
        if (allKnownMatches.length >= 3) {
            console.log(`⚠️ 안전 경고: 확실한 매칭이 ${allKnownMatches.length}개나 쌓여있습니다. (매칭 실패 의심)`);
            window.__gameState.gameCompleted = true;
            if (window.__fullAutoState) {
                window.__fullAutoState.running = false;
                updateAutoStatus("정지됨", "매칭 과다 누적 (오류 의심)");
            }
            playSound('error');
            alert(`⚠️ 안전을 위해 정지합니다!\n\n확실한 매칭이 ${allKnownMatches.length}개 이상 쌓여있습니다.\n클릭이 제대로 되지 않거나 게임 상태가 꼬인 것 같습니다.`);
            return;
        }

        // 1. 기억된 매칭
        const knownMatch = findKnownMatchCommon(window.__gameState.cardMemory);
        if (knownMatch) {
            window.__gameState.isProcessing = false;
            executeKnownMatchSafe(knownMatch[0], knownMatch[1], () => {
                window.__playNextMove();
            });
            return;
        }

        // 2. 새로운 카드 탐색
        const nextUnknownCard = findNextUnknownCardCommon(window.__gameState.cardMemory, window.__gameState.gameCards);
        if (nextUnknownCard === -1) {
            if (checkAllCardsMatched()) {
                window.__gameState.gameCompleted = true;
                showGameCompleteMessage();
            } else {
                const knownCards = window.__gameState.cardMemory.size;
                if (knownCards >= window.__gameState.gameCards.length - 2) {
                    window.__gameState.gameCompleted = true;
                    if (window.__fullAutoState) {
                        window.__fullAutoState.running = false;
                        updateAutoStatus("정지됨", "경품 모달 미출현");
                        playSound('error');
                    }
                } else {
                    window.__gameState.isProcessing = false;
                    setTimeout(() => {
                        if (!window.__gameState.gameCompleted) {
                            if (checkAllCardsMatched()) {
                                window.__gameState.gameCompleted = true;
                                showGameCompleteMessage();
                            } else {
                                window.__gameState.gameCompleted = true;
                                if (window.__fullAutoState) {
                                    window.__fullAutoState.running = false;
                                    playSound('stop');
                                }
                            }
                        }
                    }, 3000);
                }
            }
            return;
        }

        // 3. 카드 클릭 및 확인
        setTimeout(() => {
            if (window.__fullAutoState && !window.__fullAutoState.running) {
                window.__gameState.isProcessing = false;
                return;
            }
            clickGameCardNaturally(nextUnknownCard);
            setTimeout(() => {
                const cardContent = getCardContent(window.__gameState.gameCards[nextUnknownCard]);
                window.__gameState.cardMemory.set(nextUnknownCard, cardContent);

                const immediateMatch = findImmediateMatchCommon(nextUnknownCard, cardContent, window.__gameState.cardMemory);
                if (immediateMatch !== -1) {
                    setTimeout(() => {
                        clickGameCardNaturally(immediateMatch);
                        setTimeout(() => {
                            window.__gameState.isProcessing = false;
                            setTimeout(window.__playNextMove, 1500);
                        }, 1500);
                    }, 800 + Math.random() * 400);
                } else {
                    setTimeout(() => {
                        window.__gameState.isProcessing = false;
                        window.__playNextMove();
                    }, 1000 + Math.random() * 500);
                }
            }, 1000);
        }, 400 + Math.random() * 200);
    };

    window.__playNextMove();
}

function showGameCompleteMessage() {
    console.log("🎉🎉🎉 실시간 매칭 게임 완료! 🎉🎉🎉");
    playSound('success'); // 성공 사운드

    setTimeout(() => {
        checkForCompletionModal();
        setTimeout(checkForNextGameAuto, 5000);
    }, 1000);
}

function checkForNextGameAuto() {
    if (window.__fullAutoState && window.__fullAutoState.running) {
        resetGameState();
        let remainingTokens = window.__fullAutoState.tokenCount;
        if (remainingTokens !== null) {
            remainingTokens -= 1;
            window.__fullAutoState.tokenCount = remainingTokens;
            updateAutoStatus("게임 완료", "다음 게임 준비 중...", remainingTokens);

            if (remainingTokens <= 1) {
                removeAutoStatusDisplay();
                const stopButton = document.getElementById('stopAutoButton');
                if (stopButton) stopButton.remove();
                window.__fullAutoState.running = false;
                playSound('stop'); // 종료 사운드
                return;
            }
        }

        updateAutoStatus("다음 게임", "3초 후 자동 시작...", remainingTokens);
        setTimeout(() => {
            updateAutoStatus("1단계", "게임 플레이 버튼 검색 중...", remainingTokens);
            clickPlayButton();
        }, 3000);
    } else {
        setTimeout(() => {
            alert("🎉 축하합니다!\n\n실시간 매칭 시스템으로 게임을 완료했습니다!");
        }, 1000);
    }
}

// ====================================================================================================
// 10. 유틸리티 함수들
// ====================================================================================================

function createAutoStatusDisplay() {
    const existingStatus = document.getElementById('autoStatusDisplay');
    if (existingStatus) existingStatus.remove();

    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'autoStatusDisplay';
    statusDisplay.style.cssText = `
        position: fixed; top: 240px; right: 20px; z-index: 9999; padding: 15px 20px;
        background: rgba(0,0,0,0.85); color: white; border-radius: 15px; font-family: monospace;
        font-size: 14px; min-width: 250px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.1);
    `;

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

function updateAutoStatus(step, message, tokenCount = null) {
    let statusDisplay = document.getElementById('autoStatusDisplay');
    if (!statusDisplay) statusDisplay = createAutoStatusDisplay();

    const stepElement = statusDisplay.querySelector('#statusStep');
    const messageElement = statusDisplay.querySelector('#statusMessage');
    const timeElement = statusDisplay.querySelector('#statusTime');
    const tokenElement = statusDisplay.querySelector('#currentTokenCount');

    if (stepElement) stepElement.textContent = `📍 ${step}`;
    if (messageElement) messageElement.textContent = message;
    if (timeElement) timeElement.textContent = new Date().toLocaleTimeString();

    if (tokenCount !== null) {
        window.__fullAutoState = window.__fullAutoState || {};
        window.__fullAutoState.tokenCount = tokenCount;
    }

    if (tokenElement && window.__fullAutoState?.tokenCount !== undefined) {
        tokenElement.textContent = window.__fullAutoState.tokenCount;
        const tokenDisplay = statusDisplay.querySelector('#tokenDisplay');
        if (tokenDisplay) {
            if (window.__fullAutoState.tokenCount <= 1) tokenDisplay.style.background = 'rgba(255,82,82,0.3)';
            else if (window.__fullAutoState.tokenCount <= 3) tokenDisplay.style.background = 'rgba(255,193,7,0.3)';
            else tokenDisplay.style.background = 'rgba(76,175,80,0.3)';
        }
    }
}

function removeAutoStatusDisplay() {
    const statusDisplay = document.getElementById('autoStatusDisplay');
    if (statusDisplay) {
        setTimeout(() => {
            statusDisplay.style.background = 'rgba(76, 175, 80, 0.9)';
            statusDisplay.innerHTML = `
                <div style="color: white; font-weight: bold;">✅ 자동화 완료</div>
                <div style="margin-top: 5px; font-size: 12px;">모든 토큰 사용 완료</div>
            `;
            setTimeout(() => statusDisplay.remove(), 5000);
        }, 1000);
    }
}

function resetGameState() {
    if (window.__gameState) {
        if (window.__gameState.cardMemory) window.__gameState.cardMemory.clear();
        delete window.__gameState;
    }
    if (window.__playNextMove) delete window.__playNextMove;
    if (window.__cardClickHandler) {
        document.removeEventListener('click', window.__cardClickHandler);
        delete window.__cardClickHandler;
    }

    // 카드 이벤트 리스너 정리
    const existingCards = document.querySelectorAll('[data-card-index]');
    existingCards.forEach(card => {
        if (card.parentNode) card.parentNode.replaceChild(card.cloneNode(true), card);
    });
}

function findGameCardElements() {
    const ourUIContainer = document.getElementById("card-memo-container");

    // 1. 게임 컨테이너 탐색
    const gameContainer = document.querySelector('#gameArea, .game-container, .card-container, .game-board, .promotion-game-area');
    if (gameContainer) {
        let gameElements = Array.from(gameContainer.querySelectorAll('div, button, canvas, [data-index], [onclick]'));
        if (ourUIContainer) gameElements = gameElements.filter(el => !ourUIContainer.contains(el));
        if (gameElements.length >= 18) return gameElements.slice(0, 18);
    }

    // 2. 크기 기반 탐색
    let allDivs = Array.from(document.querySelectorAll('div'));
    if (ourUIContainer) allDivs = allDivs.filter(el => !ourUIContainer.contains(el));
    const cardSizedDivs = allDivs.filter(div => {
        const rect = div.getBoundingClientRect();
        return rect.width >= 50 && rect.width <= 200 && rect.height >= 50 && rect.height <= 300;
    });
    if (cardSizedDivs.length >= 18) return cardSizedDivs.slice(0, 18);

    // 3. 셀렉터 기반 탐색
    const lostarkSelectors = ['.card', '.item', '.slot', '.tile', '.grid-item', '[class*="card"]', '[class*="item"]'];
    for (const selector of lostarkSelectors) {
        let elements = Array.from(document.querySelectorAll(selector));
        if (ourUIContainer) elements = elements.filter(el => !ourUIContainer.contains(el));
        if (elements.length >= 18) return elements.slice(0, 18);
    }

    return null;
}

function isCardMatched(cardIndex) {
    const gameCards = findGameCardElements();
    if (!gameCards || !gameCards[cardIndex]) return false;
    const card = gameCards[cardIndex];

    if (card.classList.contains('is-matched') || card.classList.contains('matched') || card.classList.contains('completed')) return true;
    if (card.disabled === true) return true;
    if (getComputedStyle(card).display === 'none') return true;

    return false;
}

function checkAllCardsMatched() {
    return checkForPrizeModal() !== null;
}

function checkForPrizeModal() {
    const modals = document.querySelectorAll('.lui-modal__body, [class*="modal"], [class*="popup"]');
    for (const modal of modals) {
        const text = modal.textContent || modal.innerText;
        if (text.includes('CLEAR') && (text.includes('경품 응모권') || text.includes('지급'))) {
            return { modal, content: text };
        }
    }
    return null;
}

function checkForCompletionModal() {
    let attempts = 0;
    const checkModal = () => {
        attempts++;
        const modalInfo = checkForPrizeModal();
        if (modalInfo) {
            clickConfirmButton(modalInfo.modal);
            return;
        }
        if (attempts < 10) setTimeout(checkModal, 1000);
    };
    setTimeout(checkModal, 1000);
}

function clickConfirmButton(modalElement) {
    let confirmBtn = modalElement.querySelector('.lui-modal__confirm') ||
        Array.from(modalElement.querySelectorAll('button')).find(b => {
            const t = b.textContent;
            return t.includes('확인') || t.includes('OK') || t.includes('닫기');
        });

    if (confirmBtn) {
        setTimeout(() => confirmBtn.click(), 500);
    }
}

function getCardContent(card) {
    const img = card.querySelector('img');
    if (img && img.src) return img.src.split('/').pop();

    const dataAttrs = ['data-card-id', 'data-value', 'data-card', 'data-id'];
    for (const attr of dataAttrs) {
        const val = card.getAttribute(attr);
        if (val) return `${attr}-${val}`;
    }

    const bg = window.getComputedStyle(card).backgroundImage;
    if (bg && bg !== 'none') {
        const match = bg.match(/url\("?([^"]*)"?\)/);
        if (match) return `bg-${match[1].split('/').pop()}`;
    }

    return `unknown-${Date.now()}`;
}

function clickGameCardNaturally(cardIndexOrElement) {
    let card;
    if (typeof cardIndexOrElement === 'number') {
        const gameCards = findGameCardElements();
        if (gameCards) card = gameCards[cardIndexOrElement];
    } else {
        card = cardIndexOrElement;
    }

    if (!card) return;

    playSound('click'); // 클릭 사운드

    const rect = card.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventOptions = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    card.dispatchEvent(new MouseEvent('mouseover', eventOptions));

    setTimeout(() => {
        try {
            card.click();
        } catch (e) {
            card.dispatchEvent(new MouseEvent('click', eventOptions));
        }
    }, 150 + Math.random() * 100);
}

function checkIfGameStarted() {
    if (document.querySelector('canvas')) return true;
    if (document.querySelectorAll('#gameArea, .game-container, .card-container').length > 0) return true;
    if (document.querySelectorAll('.card, .item, .slot').length >= 10) return true;
    return false;
}

function findConfirmButtonInModal(modal) {
    return modal.querySelector('.lui-modal__confirm') ||
        Array.from(modal.querySelectorAll('button')).find(b => {
            const t = b.textContent;
            return t.includes('확인') || t.includes('OK');
        });
}

function debugGameStructure() {
    console.log("🔍 게임 구조 분석 시작...");
    const gameCards = findGameCardElements();
    if (gameCards) {
        console.log(`✅ 실제 게임 카드 요소 ${gameCards.length}개 발견`);
        gameCards.slice(0, 3).forEach((card, i) => console.log(`카드 ${i}:`, card));
    } else {
        console.log("❌ 실제 게임 카드 요소를 찾을 수 없음");
    }
}

// ====================================================================================================
// 11. 메인 실행
// ====================================================================================================

function setupCardMemoUI() {
    const container = createMainPanel();
    const header = createHeader();
    const resizeHandle = createResizeHandle();
    const { grid } = createCardGrid();

    const description = document.createElement("div");
    description.textContent = "클릭한 카드가 열리면 해당 칸에 이미지가 저장됩니다.";
    Object.assign(description.style, { marginTop: "6px", fontSize: "11px", color: "rgba(0,0,0,0.6)" });

    container.appendChild(header);
    container.appendChild(resizeHandle);
    container.appendChild(grid);
    container.appendChild(description);
    document.body.appendChild(container);

    const currentSettings = restorePanelPosition(container);
    setupDragFunctionality(container, header);
    setupResizeFunctionality(container, resizeHandle, currentSettings);
}

function runCardMemoHelper() {
    initializeCardMemoHelper();
    setupCardMemoUI();
    interceptNetworkRequests();
    updateCardDisplay();
    createFullAutoButton();
    console.log("Card Memo Helper (Refactored & Sound) 설치 완료");
}

runCardMemoHelper();
