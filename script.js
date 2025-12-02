// --- 변수 및 설정 ---
const selectedChampionIds = new Set();
const selectionHistory = [];
let turnIndex = 0;
let allChampions = [];
let currentVersion = '';
let currentRoleFilter = 'all';

const globalUsedChampions = new Set(); 
const matchHistory = [];
let isFearlessMode = true;
let gameCount = 1;

const championList = document.getElementById('champion-list');
const searchInput = document.getElementById('champion-search');
const phaseText = document.querySelector('.phase-indicator');
const draftContainer = document.querySelector('.draft-container');
const fearlessToggle = document.getElementById('fearless-toggle');
const historyBtn = document.getElementById('history-view-btn');
const filterButtons = document.querySelectorAll('.filter-btn');

// 라인 아이콘 URL
const roleIcons = {
    'TOP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png',
    'JGL': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png',
    'MID': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png',
    'ADC': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png',
    'SUP': 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png'
};
const posKeys = ['TOP', 'JGL', 'MID', 'ADC', 'SUP'];

// [최종] 라인별 챔피언 데이터 (ID 자동 보정 적용)
const championPositionDB = {
    'TOP': [
        'Garen', 'Gangplank', 'Gragas', 'Gwen', 'Gnar', 'Nasus', 'Darius', 'Rumble', 'Renekton', 'Riven', 
        'Malphite', 'Mordekaiser', 'DrMundo', 'Volibear', 'Vladimir', 'Sion', 'Sett', 'Shen', 'Singed', 
        'Aatrox', 'Ambessa', 'Yasuo', 'Ornn', 'Olaf', 'Yone', 'Yorick', 'Urgot', 'Irelia', 'Illaoi', 
        'Zac', 'Jax', 'Jayce', 'Chogath', 'Camille', 'Kennen', 'Kayle', 'Quinn', 'KSante', 'Kled', 
        'Tryndamere', 'Teemo', 'Pantheon', 'Fiora', 'Heimerdinger','Zaahen'
    ],
    'JGL': [
        'Graves', 'Naafiri', 'Nocturne', 'Nunu', 'Nidalee', 'Diana', 'Rammus', 'RekSai', 
        'Rengar', 'LeeSin', 'Lillia', 'MasterYi', 'DrMundo', 'Vi', 'Belveth', 'Volibear', 
        'Briar', 'Viego', 'Sylas', 'Shaco', 'Sejuani', 'Shyvana', 'Skarner', 'XinZhao', 
        'Amumu', 'Ivern', 'Ekko', 'Elise', 'MonkeyKing', 'Udyr', 'Warwick', 'Evelynn', 
        'JarvanIV', 'Zac', 'Jax', 'Zed', 'Karthus', 'Khazix', 'Kayn', 'Qiyana', 
        'Kindred', 'Talon', 'Trundle', 'Pantheon', 'Fiddlesticks', 'Hecarim'
    ],
    'MID': [
        'Galio', 'Diana', 'Ryze', 'Lux', 'Leblanc', 'Lissandra', 'Malzahar', 'Morgana', 'Veigar', 'Vex', 
        'Vladimir', 'Viktor', 'Sylas', 'Syndra', 'Ahri', 'AurelionSol', 'Azir', 'Akali', 'Akshan', 'Annie', 
        'Anivia', 'Yasuo', 'Ekko', 'Aurora', 'Orianna', 'Yone', 'Irelia', 'Zed', 'Xerath', 'Zoe', 
        'Kassadin', 'Cassiopeia', 'Katarina', 'Qiyana', 'Taliyah', 'TwistedFate', 'Fizz', 'Hwei','Mel'
    ],
    'ADC': [
        'Nilah', 'Draven', 'Lucian', 'MissFortune', 'Varus', 'Vayne', 'Samira', 'Smolder', 'Sivir', 
        'Aphelios', 'Ashe', 'Aurora', 'Ezreal', 'Xayah', 'Zeri', 'Ziggs', 'Jhin', 'Jinx', 
        'Kaisa', 'Kalista', 'Caitlyn', 'KogMaw', 'Corki', 'Tristana', 'Twitch','Yunara'
    ],
    'SUP': [
        'Gragas', 'Nami', 'Nautilus', 'Neeko', 'Rakan', 'Lux', 'Renata', 'Leona', 'Rell', 'Lulu', 
        'Maokai', 'Morgana', 'Milio', 'Bard', 'Velkoz', 'Braum', 'Brand', 'Blitzcrank', 'Poppy', 
        'Senna', 'Seraphine', 'Sona', 'Soraka', 'Swain', 'Thresh', 'Alistar', 'Yuumi', 'Zyra', 
        'Janna', 'Xerath', 'Zilean', 'Karma', 'Taric', 'TahmKench', 'Pyke', 'Pantheon'
    ]
};

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
        setupDragAndDrop(); 
        setupRoleFilters();
    } catch (error) { console.error(error); }
}

// --- 렌더링 함수 수정 부분 ---
function renderChampions(champions) {
    championList.innerHTML = ''; 
    championList.parentElement.scrollTop = 0;

    const filteredList = champions.filter(champ => {
        if (currentRoleFilter === 'all') return true;
        const targetList = championPositionDB[currentRoleFilter];
        return targetList && targetList.includes(champ.id);
    });

    // [수정] 랜덤 픽 버튼 (스크린샷처럼 물음표 모양)
    if (filteredList.length > 0) {
        const randomCard = document.createElement('div');
        randomCard.className = 'champion-card random-card';
        // 롤 클라이언트 랜덤 아이콘과 비슷한 느낌의 큰 물음표
        randomCard.innerHTML = `
            <div style="width:100%; aspect-ratio:1/1; background:#050505; border:1px solid #333; display:flex; justify-content:center; align-items:center; font-size:3rem; color:#444; font-weight:bold;">?</div>
            <div class="champion-name">무작위</div>
        `;
        randomCard.onclick = () => {
            const available = filteredList.filter(c => 
                !selectedChampionIds.has(c.id) && 
                !(isFearlessMode && globalUsedChampions.has(c.id))
            );
            if (available.length > 0) {
                const randomChamp = available[Math.floor(Math.random() * available.length)];
                selectChampion(randomChamp);
            } else {
                alert("선택 가능한 챔피언이 없습니다.");
            }
        };
        championList.appendChild(randomCard);
    }

    filteredList.forEach(champ => {
        const card = document.createElement('div');
        card.className = 'champion-card';
        
        // ... (선택 불가 로직 동일) ...
        if (selectedChampionIds.has(champ.id)) {
            card.style.filter = "grayscale(100%)";
            card.style.opacity = "0.3";
            card.style.cursor = "not-allowed";
        } else if (isFearlessMode && globalUsedChampions.has(champ.id)) {
            card.classList.add('fearless-banned');
        } else {
            card.onclick = () => selectChampion(champ); 
        }

        const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champ.id}.png`;
        
        // [디자인 적용] 이미지 + 아래쪽 이름
        card.innerHTML = `
            <img src="${imgUrl}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/Poro_0.jpg'">
            <div class="champion-name">${champ.name}</div>
        `;
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

function setupRoleFilters() {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRoleFilter = btn.dataset.role;
            searchInput.dispatchEvent(new Event('input')); 
        });
    });
}

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
        imgUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`;
    }

    currentSlot.style.backgroundImage = `url(${imgUrl})`;
    currentSlot.classList.add('slot-filled');
    currentSlot.dataset.champId = champ.id; 

    if (!isBan) {
        currentSlot.setAttribute('draggable', 'true');
        currentSlot.classList.add('draggable');
    }

    selectedChampionIds.add(champ.id);
    selectionHistory.push(champ.id);
    turnIndex++; 
    
    searchInput.value = ''; 
    searchInput.dispatchEvent(new Event('input')); 
    updateActiveSlot(); 
}

function setupDragAndDrop() {
    const slots = document.querySelectorAll('.pick-slot');
    let draggedSlot = null;
    slots.forEach(slot => {
        slot.addEventListener('dragstart', function(e) {
            if (!this.classList.contains('slot-filled')) { e.preventDefault(); return; }
            draggedSlot = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = "move";
        });
        slot.addEventListener('dragend', function() {
            this.classList.remove('dragging'); slots.forEach(s => s.classList.remove('drag-over')); draggedSlot = null;
        });
        slot.addEventListener('dragover', function(e) {
            e.preventDefault(); e.dataTransfer.dropEffect = "move";
            if (draggedSlot && this !== draggedSlot && this.parentElement === draggedSlot.parentElement) this.classList.add('drag-over');
        });
        slot.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
        slot.addEventListener('drop', function(e) {
            e.preventDefault(); this.classList.remove('drag-over');
            if (!draggedSlot || this === draggedSlot) return;
            const sTeam = draggedSlot.closest('.team-column'); const tTeam = this.closest('.team-column');
            if (sTeam !== tTeam) return;
            const sourceBg = draggedSlot.style.backgroundImage; const targetBg = this.style.backgroundImage;
            const sourceId = draggedSlot.dataset.champId; const targetId = this.dataset.champId;
            draggedSlot.style.backgroundImage = targetBg; this.style.backgroundImage = sourceBg;
            if (targetId) draggedSlot.dataset.champId = targetId; else delete draggedSlot.dataset.champId;
            if (sourceId) this.dataset.champId = sourceId; else delete this.dataset.champId;
            if (targetBg) draggedSlot.classList.add('slot-filled'); else draggedSlot.classList.remove('slot-filled');
            if (sourceBg) this.classList.add('slot-filled'); else this.classList.remove('slot-filled');
            draggedSlot.setAttribute('draggable', !!targetBg); this.setAttribute('draggable', !!sourceBg);
        });
    });
}

fearlessToggle.addEventListener('change', (e) => {
    isFearlessMode = e.target.checked;
    if (isFearlessMode) historyBtn.classList.remove('hidden');
    else historyBtn.classList.add('hidden');
    searchInput.dispatchEvent(new Event('input'));
});

document.getElementById('next-game-btn').addEventListener('click', () => {
    if (!confirm("현재 픽을 기록하고 다음 세트로 넘어가시겠습니까?")) return;
    const currentBluePicks = []; const currentRedPicks = [];
    document.querySelectorAll('.blue-team .pick-slot').forEach(slot => {
        if (slot.dataset.champId) { currentBluePicks.push(slot.dataset.champId); globalUsedChampions.add(slot.dataset.champId); }
    });
    document.querySelectorAll('.red-team .pick-slot').forEach(slot => {
        if (slot.dataset.champId) { currentRedPicks.push(slot.dataset.champId); globalUsedChampions.add(slot.dataset.champId); }
    });
    matchHistory.push({ game: gameCount, bluePicks: currentBluePicks, redPicks: currentRedPicks });
    gameCount++;
    resetBoardOnly();
    searchInput.dispatchEvent(new Event('input'));
});

function resetBoardOnly() {
    turnIndex = 0; selectedChampionIds.clear(); selectionHistory.length = 0;
    document.querySelectorAll('.ban-slot, .pick-slot').forEach(slot => {
        slot.style.backgroundImage = ''; slot.classList.remove('slot-filled');
        delete slot.dataset.champId; slot.removeAttribute('draggable');
    });
    updateActiveSlot();
}

historyBtn.addEventListener('click', () => {
    const historyContainer = document.getElementById('match-history-container');
    historyContainer.innerHTML = '';
    if (matchHistory.length === 0) { historyContainer.innerHTML = '<div style="padding:20px; color:#888;">아직 기록된 경기가 없습니다.</div>'; } 
    else {
        matchHistory.forEach(match => {
            const row = document.createElement('div'); row.className = 'history-row';
            const header = document.createElement('div'); header.className = 'history-game-title'; header.innerText = `Game ${match.game}`;
            row.appendChild(header);
            const content = document.createElement('div'); content.className = 'history-content-box';
            
            const blueGroup = document.createElement('div'); blueGroup.className = 'history-team-group';
            const blueLabel = document.createElement('span'); blueLabel.className = 'blue-label'; blueLabel.innerText = 'BLUE'; blueGroup.appendChild(blueLabel);
            match.bluePicks.forEach(id => { const img = document.createElement('img'); img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${id}.png`; blueGroup.appendChild(img); });
            
            const redGroup = document.createElement('div'); redGroup.className = 'history-team-group';
            match.redPicks.forEach(id => { const img = document.createElement('img'); img.src = `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${id}.png`; redGroup.appendChild(img); });
            const redLabel = document.createElement('span'); redLabel.className = 'red-label'; redLabel.innerText = 'RED'; redGroup.appendChild(redLabel);

            content.appendChild(blueGroup); content.appendChild(redGroup); row.appendChild(content); historyContainer.appendChild(row);
        });
    }
    document.getElementById('history-modal').classList.remove('hidden');
});

document.getElementById('finish-btn').addEventListener('click', () => {
    const listContainer = document.getElementById('final-matchup-list'); listContainer.innerHTML = ''; 
    const blueSlots = document.querySelectorAll('.blue-team .pick-slot'); const redSlots = document.querySelectorAll('.red-team .pick-slot');
    for (let i = 0; i < 5; i++) {
        const blueId = blueSlots[i].dataset.champId; const redId = redSlots[i].dataset.champId; const role = posKeys[i];
        const row = document.createElement('div'); row.className = 'match-row';
        const blueBanner = document.createElement('div'); blueBanner.className = 'final-banner blue-banner';
        if (blueId) blueBanner.style.backgroundImage = `url(https://cdn.communitydragon.org/latest/champion/${blueId}/splash-art/centered)`;
        const icon = document.createElement('div'); icon.className = 'lane-icon'; icon.style.backgroundImage = `url(${roleIcons[role]})`;
        const redBanner = document.createElement('div'); redBanner.className = 'final-banner red-banner';
        if (redId) redBanner.style.backgroundImage = `url(https://cdn.communitydragon.org/latest/champion/${redId}/splash-art/centered)`;
        row.appendChild(blueBanner); row.appendChild(icon); row.appendChild(redBanner); listContainer.appendChild(row);
    }
    document.getElementById('result-modal').classList.remove('hidden');
});

document.getElementById('close-history-btn').addEventListener('click', () => document.getElementById('history-modal').classList.add('hidden'));
document.getElementById('close-result-btn').addEventListener('click', () => document.getElementById('result-modal').classList.add('hidden'));
document.getElementById('undo-btn').addEventListener('click', () => {
    if (turnIndex <= 0) return;
    turnIndex--; const slot = getCurrentSlotElement();
    const lastId = selectionHistory.pop(); selectedChampionIds.delete(lastId);
    slot.style.backgroundImage = ''; slot.classList.remove('slot-filled'); delete slot.dataset.champId; slot.removeAttribute('draggable');
    searchInput.dispatchEvent(new Event('input')); updateActiveSlot();
});
document.getElementById('reset-btn').addEventListener('click', () => {
    if(!confirm("모든 기록을 초기화하시겠습니까?")) return;
    globalUsedChampions.clear(); matchHistory.length=0; gameCount=1;
    resetBoardOnly(); searchInput.dispatchEvent(new Event('input'));
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
    } else {
        phaseText.innerText = "DRAFT COMPLETED (DRAG TO SWAP)";
        phaseText.style.color = "#C8AA6E";
    }
}

initChampionData();
