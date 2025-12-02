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

(function () {
    'use strict';

    // ===== 글로벌 상태 관리 =====
    let cards = [];
    let matchedPairs = new Set();
    let flippedCards = [];
    let gameStartTime = null;
    let matchCount = 0;
    let isGameActive = false;

    // 자동화 상태
    window.__gameState = {
        isAutoPlaying: false,
        currentStep: 0,
        maxSteps: 50,
        isProcessing: false
    };
    window.__singleGameState = {
        isMatching: false,
        stepCounter: 0,
        maxSteps: 50
    };

    // ===== UI 관련 변수 =====
    let panel = null;
    let gameContainer = null;
    let cardSlots = [];
    let cardMemoryDisplay = null;

    // 카드 메모리 저장소
    window.__cardMemo = new Array(18).fill(null);
    window.__cardDone = [];

    // ===== 유틸리티 함수 =====
    function createButton(text, clickHandler, className = '') {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `memory-btn ${className}`;
        button.style.cssText = `
            background: #3498db;
            border: none;
            color: white;
            padding: 8px 12px;
            margin: 2px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 12px;
            transition: background-color 0.3s;
        `;
        button.addEventListener('click', clickHandler);
        return button;
    }

    function log(message, level = 'info') {
        const colors = {
            info: '#2ecc71',
            warn: '#f39c12',
            error: '#e74c3c',
            success: '#27ae60'
        };
        console.log(
            `%c[카드 메모리] ${message}`,
            `color: ${colors[level]}; font-weight: bold;`
        );
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== 게임 상태 감지 =====
    function checkForPrizeModal() {
        const modal = document.querySelector('.lui-modal__body');
        if (!modal) return false;

        const titleElement = modal.querySelector('.lui-modal__header-title');
        const contentElement = modal.querySelector('.lui-modal__content');

        if (titleElement?.textContent?.includes('CLEAR') &&
            contentElement?.textContent?.includes('경품 응모권이 지급되었습니다')) {
            log('경품 응모권 지급 모달 감지됨 - 게임 완료!', 'success');
            return true;
        }
        return false;
    }

    function checkAllCardsMatched() {
        return checkForPrizeModal();
    }

    // ===== 카드 메모리 표시 시스템 =====
    function createCardMemoryDisplay() {
        if (cardMemoryDisplay) return;

        cardMemoryDisplay = document.createElement('div');
        cardMemoryDisplay.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 410px;
            background: rgba(44, 62, 80, 0.95);
            border: 2px solid #34495e;
            border-radius: 8px;
            padding: 15px;
            z-index: 2147483647; /* 최대 z-index */
            font-family: Arial, sans-serif;
            color: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            pointer-events: none; /* 클릭 통과 방지 */
        `;
        // pointer-events: auto로 설정해야 버튼 클릭 가능, 컨테이너는 none일 필요 없음
        cardMemoryDisplay.style.pointerEvents = 'auto';

        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
            color: #ecf0f1;
            font-size: 14px;
            border-bottom: 1px solid #34495e;
            padding-bottom: 8px;
        `;
        header.textContent = '카드 메모리';

        const cardGrid = document.createElement('div');
        cardGrid.className = 'card-memo-grid';
        cardGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(6, 63px);
            gap: 4px;
            margin-top: 10px;
            justify-content: center;
        `;

        // 18장의 카드 슬롯 생성
        for (let i = 0; i < 18; i++) {
            const slot = document.createElement('div');
            slot.className = 'card-memo-slot';
            slot.style.cssText = `
                width: 63px;
                height: 84px;
                background: #fafafa;
                border: 1px dashed rgba(0,0,0,0.15);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #bdc3c7;
                position: relative;
                overflow: hidden;
                cursor: default;
            `;

            const img = document.createElement('img');
            img.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: none;
            `;
            slot.appendChild(img);

            const label = document.createElement('span');
            label.textContent = i + 1;
            label.style.cssText = `
                position: absolute;
                top: 2px;
                left: 2px;
                font-size: 8px;
                background: rgba(0,0,0,0.7);
                padding: 1px 3px;
                border-radius: 2px;
            `;
            slot.appendChild(label);

            cardGrid.appendChild(slot);
        }

        cardMemoryDisplay.appendChild(header);
        cardMemoryDisplay.appendChild(cardGrid);

        // 안전하게 body 또는 documentElement에 추가
        if (document.body) {
            document.body.appendChild(cardMemoryDisplay);
        } else {
            document.documentElement.appendChild(cardMemoryDisplay);
        }
    }

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
            if (indices.length === 2) {
                const color = colorPalette[colorIndex % colorPalette.length];
                indices.forEach(index => {
                    cardColors[index] = color;
                });
                colorIndex++;
            }
        });

        for (let i = 0; i < 18; i++) {
            const cardImageUrl = window.__cardMemo[i];
            const slot = cardSlots[i];
            if (!slot) continue;

            const image = slot.querySelector('img');

            if (cardImageUrl) {
                image.src = cardImageUrl;
                image.style.display = "block";
                slot.style.background = "#fff";
                slot.style.borderStyle = "solid";

                // 매칭된 쌍에 색상 테두리 추가
                if (cardColors[i]) {
                    slot.style.border = `3px solid ${cardColors[i]}`;
                    slot.style.boxShadow = `0 0 15px ${cardColors[i]}60`;
                    slot.style.backgroundColor = `${cardColors[i]}20`;
                } else {
                    slot.style.border = "1px solid #ccc";
                    slot.style.boxShadow = "none";
                    slot.style.backgroundColor = "#fff";
                }

                // 완료된 카드는 어둡게 표시
                if (window.__cardDone.includes(i)) {
                    slot.style.opacity = "0.4";
                } else {
                    slot.style.opacity = "1";
                }
            } else {
                image.style.display = "none";
                slot.style.background = "#fafafa";
                slot.style.borderStyle = "dashed";
                slot.style.border = "1px dashed rgba(0,0,0,0.15)";
                slot.style.boxShadow = "none";
                slot.style.opacity = "1";
            }
        }
    }

    // ===== 네트워크 감지 시스템 =====
    function interceptCardData() {
        // XMLHttpRequest 인터셉트
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._url = url;
            return originalXHROpen.apply(this, [method, url, ...args]);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                if (this._url && this._url.includes('card') && this._url.includes('game')) {
                    try {
                        const response = JSON.parse(this.responseText);
                        if (response && response.data && response.data.cards) {
                            processCardData(response.data.cards);
                        }
                    } catch (e) {
                        // JSON 파싱 실패는 무시
                    }
                }
            });
            return originalXHRSend.apply(this, args);
        };

        // Fetch API 인터셉트
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            return originalFetch.apply(this, args).then(response => {
                if (args[0] && args[0].includes && args[0].includes('card')) {
                    response.clone().json().then(data => {
                        if (data && data.data && data.data.cards) {
                            processCardData(data.data.cards);
                        }
                    }).catch(() => { });
                }
                return response;
            });
        };
    }

    function processCardData(cardData) {
        if (Array.isArray(cardData)) {
            cardData.forEach((card, index) => {
                if (card.image && index < 18) {
                    window.__cardMemo[index] = card.image;
                }
            });
            updateCardDisplay();
            log(`카드 데이터 업데이트: ${cardData.length}장`, 'info');
        }
    }
    function collectCardImages() {
        cards = [];
        cardSlots = [];

        // 게임 보드 컨테이너 찾기 시도 (실패해도 중단하지 않음)
        const gameBoard = document.querySelector('.card-game-board') || document.body;

        // 카드 슬롯 찾기 (컨테이너 내부 또는 전체 문서에서)
        let cardElements = gameBoard.querySelectorAll('.card-slot');

        // 만약 컨테이너에서 못 찾았다면 전체 문서에서 다시 검색
        if (cardElements.length === 0) {
            cardElements = document.querySelectorAll('.card-slot');
        }

        if (cardElements.length === 0) {
            const iframes = document.querySelectorAll('iframe');
            if (iframes.length > 0) {
                log(`[중요] 현재 화면에서 ${iframes.length}개의 iframe이 발견되었습니다.`, 'warn');
                log(`카드는 iframe 안에 있을 확률이 높습니다. 개발자 도구 콘솔 상단의 'top' 드롭다운을 눌러 다른 프레임(예: game-frame)을 선택한 후 다시 실행해보세요.`, 'warn');
            } else {
                log('카드 슬롯(.card-slot)을 찾을 수 없습니다. 게임이 실행 중인지 확인해주세요.', 'error');
            }
            return false;
        }

        cardElements.forEach((cardElement, index) => {
            const imgElement = cardElement.querySelector('img');
            const imgSrc = imgElement ? imgElement.src : '';

            cardSlots.push(cardElement);
            cards.push({
                index: index,
                element: cardElement,
                imgSrc: imgSrc,
                revealed: false,
                matched: false
            });
        });

        // 카드가 발견되면 성공 로그
        if (cards.length > 0) {
            // log(`카드 수집 완료: ${cards.length}장의 카드 발견`, 'info'); // 너무 빈번하면 주석 처리
            return true;
        }

        return false;
    }

    function analyzeCards() {
        const imageGroups = {};

        cards.forEach(card => {
            if (card.imgSrc && !card.imgSrc.includes('card_back')) {
                if (!imageGroups[card.imgSrc]) {
                    imageGroups[card.imgSrc] = [];
                }
                imageGroups[card.imgSrc].push(card);
            }
        });

        return imageGroups;
    }

    // ===== 카드 매칭 로직 =====
    async function clickCard(cardIndex) {
        if (cardIndex >= cardSlots.length) return false;

        const cardElement = cardSlots[cardIndex];
        if (!cardElement) return false;

        cardElement.click();
        await delay(200);
        return true;
    }

    async function performMatching() {
        // 클릭할 카드 요소들을 수집 (클릭 동작을 위해 필요)
        if (!collectCardImages()) return false;

        // 1. 인터셉트된 데이터(window.__cardMemo)가 있는지 확인
        const memo = window.__cardMemo;
        const hasInterceptedData = memo.some(img => img !== null);

        if (hasInterceptedData) {
            // 데이터 기반 매칭 로직
            const memoMap = {}; // 이미지 URL -> [인덱스 목록]

            // 아직 완료되지 않은 카드들의 위치를 파악
            for (let i = 0; i < 18; i++) {
                if (memo[i] && !window.__cardDone.includes(i)) {
                    const img = memo[i];
                    if (!memoMap[img]) memoMap[img] = [];
                    memoMap[img].push(i);
                }
            }

            // 매칭 가능한 쌍 찾기
            for (const [img, indices] of Object.entries(memoMap)) {
                if (indices.length >= 2) {
                    const idx1 = indices[0];
                    const idx2 = indices[1];

                    log(`매칭 발견 (데이터 기반): ${idx1 + 1}번 & ${idx2 + 1}번`, 'info');

                    // 첫 번째 카드 클릭
                    await clickCard(idx1);
                    await delay(300);

                    // 두 번째 카드 클릭
                    await clickCard(idx2);
                    await delay(500);

                    // 완료 상태 업데이트
                    window.__cardDone.push(idx1, idx2);
                    updateCardDisplay(); // UI 갱신 (완료된 카드 표시)

                    return true; // 한 번에 한 쌍씩 처리
                }
            }
        }

        // 2. 데이터가 없거나 매칭을 못 찾은 경우, 기존 화면 분석 로직(폴백) 시도
        // (이미 뒤집혀 있는 카드를 보고 매칭하는 경우 등)
        const imageGroups = analyzeCards();

        for (const [imgSrc, groupCards] of Object.entries(imageGroups)) {
            if (groupCards.length >= 2) {
                const card1 = groupCards[0];
                const card2 = groupCards[1];

                // 이미 완료된 카드는 제외
                if (window.__cardDone.includes(card1.index) || window.__cardDone.includes(card2.index)) {
                    continue;
                }

                if (!card1.matched && !card2.matched) {
                    log(`매칭 시도 (화면 분석): 카드 ${card1.index + 1}번과 ${card2.index + 1}번`, 'info');

                    await clickCard(card1.index);
                    await delay(300);
                    await clickCard(card2.index);
                    await delay(500);

                    card1.matched = true;
                    card2.matched = true;

                    window.__cardDone.push(card1.index, card2.index);
                    updateCardDisplay();

                    return true;
                }
            }
        }

        return false;
    }

    // ===== 단일 게임 실시간 매칭 =====
    async function startSingleGameMatching() {
        if (window.__singleGameState.isMatching) {
            log('이미 실시간 매칭이 실행 중입니다', 'warn');
            return;
        }

        window.__singleGameState.isMatching = true;
        window.__singleGameState.stepCounter = 0;
        log('실시간 매칭 시작', 'info');

        try {
            while (window.__singleGameState.isMatching &&
                window.__singleGameState.stepCounter < window.__singleGameState.maxSteps) {

                window.__singleGameState.stepCounter++;

                if (checkAllCardsMatched()) {
                    log('게임 완료 감지됨!', 'success');
                    break;
                }

                const matchFound = await performMatching();
                if (!matchFound) {
                    log('더 이상 매칭 가능한 카드가 없습니다', 'warn');
                    break;
                }

                await delay(1000);
            }
        } catch (error) {
            log(`실시간 매칭 중 오류: ${error.message}`, 'error');
        } finally {
            window.__singleGameState.isMatching = false;
            log('실시간 매칭 종료', 'info');
        }
    }

    function stopSingleGameMatching() {
        if (window.__singleGameState.isMatching) {
            window.__singleGameState.isMatching = false;
            log('실시간 매칭을 중지했습니다', 'warn');
        }
    }

    // ===== 완전 자동화 =====
    async function startFullAutomation() {
        if (window.__gameState.isAutoPlaying) {
            log('이미 자동화가 실행 중입니다', 'warn');
            return;
        }

        window.__gameState.isAutoPlaying = true;
        window.__gameState.currentStep = 0;
        log('완전 자동화 시작', 'info');

        try {
            while (window.__gameState.isAutoPlaying &&
                window.__gameState.currentStep < window.__gameState.maxSteps) {

                window.__gameState.currentStep++;
                log(`자동화 단계 ${window.__gameState.currentStep}`, 'info');

                if (checkAllCardsMatched()) {
                    log('경품 응모권 지급 확인 - 다음 게임으로 진행', 'success');
                    await delay(2000);

                    // 다음 게임 버튼 클릭
                    const nextButton = document.querySelector('.btn-next, .next-game, [class*="next"]');
                    if (nextButton) {
                        nextButton.click();
                        await delay(3000);
                        continue;
                    }
                }

                const matchFound = await performMatching();
                if (!matchFound) {
                    log('매칭 불가 - 다음 게임으로 스킵', 'warn');
                    await delay(1000);

                    const skipButton = document.querySelector('.btn-skip, .skip-game, [class*="skip"]');
                    if (skipButton) {
                        skipButton.click();
                        await delay(3000);
                    }
                }

                await delay(1000);
            }
        } catch (error) {
            log(`완전 자동화 중 오류: ${error.message}`, 'error');
        } finally {
            window.__gameState.isAutoPlaying = false;
            log('완전 자동화 종료', 'info');
        }
    }

    function stopFullAutomation() {
        if (window.__gameState.isAutoPlaying) {
            window.__gameState.isAutoPlaying = false;
            log('완전 자동화를 중지했습니다', 'warn');
        }
    }

    // ===== UI 패널 생성 =====
    function createMemoryPanel() {
        if (panel) return;

        // 패널 컨테이너
        panel = document.createElement('div');
        panel.className = 'card-memory-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 250px;
            background: rgba(44, 62, 80, 0.95);
            border: 2px solid #34495e;
            border-radius: 8px;
            padding: 15px;
            z-index: 2147483647; /* 최대 z-index */
            font-family: Arial, sans-serif;
            color: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            cursor: move;
        `;

        // 제목
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            font-weight: bold;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #34495e;
            color: #ecf0f1;
            font-size: 14px;
        `;
        header.textContent = '카드 메모리 도우미';

        // 버튼 컨테이너
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

        // 버튼들 추가
        const realtimeBtn = createButton('실시간 매칭 - 단일 게임', () => {
            if (window.__singleGameState.isMatching) {
                stopSingleGameMatching();
                realtimeBtn.textContent = '실시간 매칭';
                realtimeBtn.style.background = '#3498db';
            } else {
                startSingleGameMatching();
                realtimeBtn.textContent = '매칭 중지';
                realtimeBtn.style.background = '#e74c3c';
            }
        });

        const autoBtn = createButton('완전 자동화 - 연속 게임', () => {
            if (window.__gameState.isAutoPlaying) {
                stopFullAutomation();
                autoBtn.textContent = '완전 자동화';
                autoBtn.style.background = '#27ae60';
            } else {
                startFullAutomation();
                autoBtn.textContent = '자동화 중지';
                autoBtn.style.background = '#e74c3c';
            }
        });

        const debugBtn = createButton('디버그 정보', () => {
            collectCardImages();
            const imageGroups = analyzeCards();
            console.log('카드 정보:', cards);
            console.log('이미지 그룹:', imageGroups);
            log('디버그 정보가 콘솔에 출력되었습니다', 'info');
        });

        const resetBtn = createButton('초기화', () => {
            stopSingleGameMatching();
            stopFullAutomation();
            cards = [];
            matchedPairs.clear();
            flippedCards = [];
            // 카드 메모리도 초기화
            window.__cardMemo = new Array(18).fill(null);
            window.__cardDone = [];
            updateCardDisplay();
            log('모든 상태가 초기화되었습니다', 'info');
        });

        // 버튼들을 컨테이너에 추가
        buttonContainer.appendChild(realtimeBtn);
        buttonContainer.appendChild(autoBtn);
        buttonContainer.appendChild(debugBtn);
        buttonContainer.appendChild(resetBtn);

        // 패널에 요소들 추가
        panel.appendChild(header);
        panel.appendChild(buttonContainer);

        // 드래그 기능
        let isDragging = false;
        let startX, startY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX - panel.offsetLeft;
            startY = e.clientY - panel.offsetTop;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const newX = e.clientX - startX;
                const newY = e.clientY - startY;
                panel.style.left = Math.max(0, newX) + 'px';
                panel.style.top = Math.max(0, newY) + 'px';
                panel.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'move';
            }
        });

        // 안전하게 body 또는 documentElement에 추가
        if (document.body) {
            document.body.appendChild(panel);
        } else {
            document.documentElement.appendChild(panel);
        }
        log('카드 메모리 도우미 패널이 생성되었습니다', 'success');
    }

    // ===== 초기화 =====
    function initialize() {
        log('카드 메모리 도우미를 초기화합니다...', 'info');

        // 기존 패널 제거
        if (panel) {
            panel.remove();
            panel = null;
        }
        if (cardMemoryDisplay) {
            cardMemoryDisplay.remove();
            cardMemoryDisplay = null;
        }

        // 새 패널들 생성
        createMemoryPanel();
        createCardMemoryDisplay();

        // 네트워크 인터셉트 시작
        interceptCardData();

        log('초기화가 완료되었습니다!', 'success');
    }

    // ===== 자동 시작 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // 전역 접근을 위한 함수 노출
    window.CardMemoryHelper = {
        startSingleGameMatching,
        stopSingleGameMatching,
        startFullAutomation,
        stopFullAutomation,
        initialize
    };

})();