// --- 변수 및 설정 ---
const selectedChampionIds = new Set();
const selectionHistory = [];
let turnIndex = 0;
let allChampions = [];
let currentVersion = '';
let swapSourceSlot = null;

const globalUsedChampions = new Set(); 
const matchHistory = [];
let isFearlessMode = false;
let gameCount = 1;

// DOM 요소
const championList = document.getElementById('champion-list');
const searchInput = document.getElementById('champion-search');
const phaseText = document.querySelector('.phase-indicator');
const draftContainer = document.querySelector('.draft-container');
const fearlessToggle = document.getElementById('fearless-toggle');
const historyBtn = document.getElementById('history-view-btn');

// 라인 아이콘 (Community Dragon)
const roleIcons = {
    'TOP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    'JGL': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    'MID': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    'ADC': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    'SUP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png'
};
const posKeys = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];

// 밴픽 순서
const draftOrder = [
    { type: 'ban', team: 'blue', index: 0 }, { type: 'ban', team: 'blue', index: 1 },
    { type: 'ban', team: 'red',  index: 0 }, { type: 'ban', team: 'red',  index: 1 },
    { type: 'ban', team: 'blue', index: 2 }, { type: 'ban', team: 'red',  index: 2 },
    { type: 'pick', team: 'blue', index: 0 }, { type: 'pick', team: 'red',  index: 0 },
    { type: 'pick', team: 'red',  index: 1 }, { type: 'pick', team: 'blue', index: 1 },
    { type: 'pick', team: 'blue', index: 2 }, { type: 'pick', team: 'red',  index: 2 },
    { type: 'ban', team: 'red',  index: 3 }, { type: 'ban', team: 'blue', index: 3 },
    { type: 'ban', team: 'red',  index: 4 }, { type: 'ban', team: 'blue', index: 4 },
    { type: 'pick', team: 'red',  index: 3 }, { type: 'pick', team: 'blue', index: 3 },
    { type: 'pick', team: 'blue', index: 4 }, { type: 'pick', team: 'red',  index: 4 }
];

// --- 1. 초기화 ---
async function initChampionData() {
    try {
        const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await versionRes.json();
        currentVersion = versions[0]; 
        const dataRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/ko_KR/champion.json`);
        const dataJson = await dataRes.json();
        allChampions = Object.values(dataJson.data);
        allChampions.sort((a, b) => a.name.localeCompare(b.name));
        
        renderChampions(allChampions);
        updateActiveSlot(); 
        setupSwapListeners();
    } catch (error) { console.error(error); }
}

// --- 2. 렌더링 ---
function renderChampions(champions) {
    championList.innerHTML = ''; 
    championList.parentElement.scrollTop = 0;

    champions.forEach(champ => {
        const card = document.createElement('div');
        card.className = 'champion-card';
        
        if (selectedChampionIds.has(champ.id)) {
            card.style.filter = "grayscale(100%)";
            card.style.opacity = "0.4";
            card.style.cursor = "not-allowed";
        } else if (isFearlessMode && globalUsedChampions.has(champ.id)) {
            card.classList.add('fearless-banned');
        } else {
            card.onclick = () => selectChampion(champ); 
        }

        const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champ.id}.png`;
        card.innerHTML = `<img src="${imgUrl}"><div class="champion-name">${champ.name}</div>`;
        championList.appendChild(card);
    });
}

searchInput.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase().replace(/\s/g, ""); 
    const filtered = allChampions.filter(champ => {
        const nameKr = champ.name.replace(/\s/g, "");
        const idEn = champ.id.toLowerCase();
        return nameKr.includes(keyword) || idEn.includes(keyword);
    });
    renderChampions(filtered);
});

// --- 3. 챔피언 선택 ---
function selectChampion(champ) {
    if (turnIndex >= draftOrder.length) return;
    if (selectedChampionIds.has(champ.id)) return;
    if (isFearlessMode && globalUsedChampions.has(champ.id)) return;

    const currentSlot = getCurrentSlotElement();
    const isBan = draftOrder[turnIndex].type === 'ban';
    
    let imgUrl;
    if (isBan) {
        imgUrl = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champ.id}.png`;
    } else {
        // 원본 스플래시 (가장 넓은 이미지) 사용
        imgUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`;
    }

    currentSlot.style.backgroundImage = `url(${imgUrl})`;
    currentSlot.classList.add('slot-filled');
    currentSlot.dataset.champId = champ.id; 

    selectedChampionIds.add(champ.id);
    selectionHistory.push(champ.id);
    turnIndex++; 
    
    searchInput.value = ''; 
    renderChampions(allChampions); 
    updateActiveSlot(); 
}

// --- 4. 피어리스 모드 ---
fearlessToggle.addEventListener('change', (e) => {
    isFearlessMode = e.target.checked;
    if (isFearlessMode) historyBtn.classList.remove('hidden');
    else historyBtn.classList.add('hidden');
    renderChampions(allChampions);
});

document.getElementById('next-game-btn').addEventListener('click', () => {

    const currentBluePicks = [];
    const currentRedPicks = [];

    document.querySelectorAll('.blue-team .pick-slot').forEach(slot => {
        if (slot.dataset.champId) {
            currentBluePicks.push(slot.dataset.champId);
            globalUsedChampions.add(slot.dataset.champId);
        }
    });

    document.querySelectorAll('.red-team .pick-slot').forEach(slot => {
        if (slot.dataset.champId) {
            currentRedPicks.push(slot.dataset.champId);
            globalUsedChampions.add(slot.dataset.champId);
        }
    });

    matchHistory.push({
        game: gameCount,
        bluePicks: currentBluePicks,
        redPicks: currentRedPicks
    });
    gameCount++;

    resetBoardOnly();
    renderChampions(allChampions);
});

function resetBoardOnly() {
    turnIndex = 0;
    selectedChampionIds.clear();
    selectionHistory.length = 0;
    swapSourceSlot = null;
    draftContainer.classList.remove('swap-mode');

    document.querySelectorAll('.ban-slot, .pick-slot').forEach(slot => {
        slot.style.backgroundImage = '';
        slot.classList.remove('slot-filled');
        slot.classList.remove('swap-selected');
        delete slot.dataset.champId;
    });
    updateActiveSlot();
}

// --- 5. 결과 및 기록 보기 ---

// [수정된 부분] 기록 보기 버튼 클릭 (Red 텍스트 오른쪽 정렬 로직 포함)
historyBtn.addEventListener('click', () => {
    const historyContainer = document.getElementById('match-history-container');
    historyContainer.innerHTML = '';

    if (matchHistory.length === 0) {
        historyContainer.innerHTML = '<div style="padding:20px; color:#888;">아직 기록된 경기가 없습니다.</div>';
    } else {
        matchHistory.forEach(match => {
            const row = document.createElement('div');
            row.className = 'history-row';
            
            const header = document.createElement('div');
            header.className = 'history-game-title';
            header.innerText = `Game ${match.game}`;
            row.appendChild(header);

            const content = document.createElement('div');
            content.className = 'history-content-box';

            // 1. 블루팀 (TEXT -> IMG)
            const blueGroup = document.createElement('div');
            blueGroup.className = 'history-team-group';
            
            const blueLabel = document.createElement('span');
            blueLabel.className = 'blue-label';
            blueLabel.innerText = 'BLUE';
            blueGroup.appendChild(blueLabel);

            match.bluePicks.forEach(id => {
                const img = document.createElement('img');
                img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${id}.png`;
                blueGroup.appendChild(img);
            });

            // 2. 레드팀 (IMG -> TEXT) : 순서 변경됨
            const redGroup = document.createElement('div');
            redGroup.className = 'history-team-group';
            
            match.redPicks.forEach(id => {
                const img = document.createElement('img');
                img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${id}.png`;
                redGroup.appendChild(img);
            });

            const redLabel = document.createElement('span');
            redLabel.className = 'red-label';
            redLabel.innerText = 'RED';
            redGroup.appendChild(redLabel);

            content.appendChild(blueGroup);
            content.appendChild(redGroup);
            row.appendChild(content);

            historyContainer.appendChild(row);
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
});

document.getElementById('finish-btn').addEventListener('click', showResult);

function showResult() {
    const listContainer = document.getElementById('final-matchup-list');
    listContainer.innerHTML = ''; 

    const blueSlots = document.querySelectorAll('.blue-team .pick-slot');
    const redSlots = document.querySelectorAll('.red-team .pick-slot');

    for (let i = 0; i < 5; i++) {
        const blueId = blueSlots[i].dataset.champId;
        const redId = redSlots[i].dataset.champId;
        const role = posKeys[i];
        listContainer.appendChild(createMatchRow(blueId, redId, role));
    }
    document.getElementById('result-modal').classList.remove('hidden');
}

function createMatchRow(blueId, redId, role) {
    const row = document.createElement('div');
    row.className = 'match-row';

    const blueBanner = document.createElement('div');
    blueBanner.className = 'final-banner blue-banner';
    if (blueId) blueBanner.style.backgroundImage = `url(https://cdn.communitydragon.org/latest/champion/${blueId}/splash-art/centered)`;
    
    const icon = document.createElement('div');
    icon.className = 'lane-icon';
    icon.style.backgroundImage = `url(${roleIcons[role]})`;

    const redBanner = document.createElement('div');
    redBanner.className = 'final-banner red-banner';
    if (redId) redBanner.style.backgroundImage = `url(https://cdn.communitydragon.org/latest/champion/${redId}/splash-art/centered)`;

    row.appendChild(blueBanner);
    row.appendChild(icon);
    row.appendChild(redBanner);
    return row;
}

// 기타 유틸
document.getElementById('close-history-btn').addEventListener('click', () => document.getElementById('history-modal').classList.add('hidden'));
document.getElementById('close-result-btn').addEventListener('click', () => document.getElementById('result-modal').classList.add('hidden'));
document.getElementById('undo-btn').addEventListener('click', () => {
    if (turnIndex <= 0) return;
    if(turnIndex >= draftOrder.length) { draftContainer.classList.remove('swap-mode'); swapSourceSlot=null; document.querySelectorAll('.swap-selected').forEach(e=>e.classList.remove('swap-selected')); }
    turnIndex--; const slot = getCurrentSlotElement();
    const lastId = selectionHistory.pop(); selectedChampionIds.delete(lastId);
    slot.style.backgroundImage = ''; slot.classList.remove('slot-filled'); delete slot.dataset.champId;
    renderChampions(allChampions); updateActiveSlot();
});
document.getElementById('reset-btn').addEventListener('click', () => {
    if(!confirm("모든 기록을 초기화하시겠습니까?")) return;
    globalUsedChampions.clear(); matchHistory.length=0; gameCount=1;
    resetBoardOnly(); renderChampions(allChampions);
});
function getCurrentSlotElement() {
    if (turnIndex >= draftOrder.length) return null;
    const t = draftOrder[turnIndex];
    return document.querySelector(t.team === 'blue' ? '.blue-team' : '.red-team').querySelector(t.type === 'ban' ? '.ban-container' : '.pick-container').children[t.index];
}
function updateActiveSlot() {
    document.querySelectorAll('.active-turn').forEach(el => el.classList.remove('active-turn'));
    const slot = getCurrentSlotElement();
    if (slot) {
        slot.classList.add('active-turn');
        phaseText.innerText = `${draftOrder[turnIndex].team.toUpperCase()} ${draftOrder[turnIndex].type.toUpperCase()}`;
        phaseText.style.color = draftOrder[turnIndex].team === 'blue' ? '#0AC8B9' : '#FF4444';
        draftContainer.classList.remove('swap-mode');
    } else {
        phaseText.innerText = "DRAFT COMPLETED (SWAP AVAILABLE)";
        phaseText.style.color = "#C8AA6E";
        draftContainer.classList.add('swap-mode');
    }
}
function setupSwapListeners() {
    document.querySelectorAll('.pick-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            if (turnIndex < draftOrder.length) return;
            if (!swapSourceSlot) { swapSourceSlot = this; this.classList.add('swap-selected'); }
            else {
                if (swapSourceSlot === this) { this.classList.remove('swap-selected'); swapSourceSlot = null; return; }
                const sTeam = swapSourceSlot.closest('.team-column'); const tTeam = this.closest('.team-column');
                if (sTeam !== tTeam) { alert("같은 팀끼리만!"); swapSourceSlot.classList.remove('swap-selected'); swapSourceSlot = null; return; }
                const tempBg = swapSourceSlot.style.backgroundImage; swapSourceSlot.style.backgroundImage = this.style.backgroundImage; this.style.backgroundImage = tempBg;
                const tempId = swapSourceSlot.dataset.champId; swapSourceSlot.dataset.champId = this.dataset.champId; this.dataset.champId = tempId;
                swapSourceSlot.classList.remove('swap-selected'); swapSourceSlot = null;
            }
        });
    });
}


initChampionData();
