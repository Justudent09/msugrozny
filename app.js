let tg = window.Telegram.WebApp;
let selectedGroup = 'ПМИ-2курс';
let jsonData;
let currentDate = new Date();
let groupChanged = false;


const allowedIDs = ['942573399','887422835','894041982','716244479','5136839421', '1033479948'];

function checkUserAccess() {
    const user = tg.initDataUnsafe?.user;
    const userID = user ? String(user.id) : null;
    const litElement = document.getElementById('lit');

    if (userID && allowedIDs.includes(userID)) {
        litElement.style.display = 'block';
    } else {
        litElement.style.display = 'none';
    }
}

tg.ready();
document.addEventListener('DOMContentLoaded', checkUserAccess);

function updateMonthName() {
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Aвгуст", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const monthNameElement = document.getElementById('month-name');
    monthNameElement.textContent = `${monthNames[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
}

function updateWeekdays() {
    const weekdaysContainer = document.getElementById('weekdays');
    weekdaysContainer.innerHTML = ''; 

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const weekdayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const div = document.createElement('div');
        div.className = 'day-block';
        div.onclick = () => selectDay(i);
        
        const dayAbbreviation = document.createElement('span');
        dayAbbreviation.textContent = weekdayNames[date.getDay()];

        const dayNumber = document.createElement('span');
        dayNumber.textContent = `${i}`;
        
        div.appendChild(dayAbbreviation);
        div.appendChild(dayNumber);
        weekdaysContainer.appendChild(div);
    }

    selectDay(currentDate.getDate());
    scrollToCurrentDay();
}

function scrollToCurrentDay() {
    const weekdaysContainer = document.getElementById('weekdays');
    const currentDayElement = document.querySelector(`.weekdays div:nth-child(${currentDate.getDate()})`);
    if (currentDayElement) {
        const containerWidth = weekdaysContainer.clientWidth;
        const dayOffset = currentDayElement.offsetLeft - (containerWidth / 2) + (currentDayElement.offsetWidth / 2);
        weekdaysContainer.scrollLeft = dayOffset;
    }
}

function selectDay(day) {
    currentDate.setDate(day);

    document.querySelectorAll('.weekdays div').forEach(div => {
        div.classList.remove('active');
    });

    const selectedDayDiv = document.querySelector(`.weekdays div:nth-child(${day})`);
    selectedDayDiv.classList.add('active');

    updateTaskList(currentDate);
}

function checkTaskCompletion() {
    const taskList = document.getElementById('taskList');
    const currentTime = new Date();
    const taskItems = taskList.querySelectorAll('li');
    
    taskItems.forEach((item, index) => {
        const timeText = item.querySelector('span').textContent;
        const [startTime, endTime] = timeText.split('-').map(t => {
            const [hours, minutes] = t.split(':').map(Number);
            return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
        });
        
        if (currentTime >= startTime && currentTime < endTime) {
            item.classList.add('active');
            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            checkmark.innerHTML = '&#10003;';
            item.appendChild(checkmark);
        } else if (currentTime >= endTime) {
            item.classList.add('completed');
        }
    });
}

const menuButton = document.getElementById('menu-button');
const groupModal = document.getElementById('group-modal');
const closeModalButton = document.getElementById('close-modal');
const groupItems = document.querySelectorAll('.group-item');
const uploadInput = document.getElementById('upload');
const emptyPairs = document.getElementById('empty-pairs-modal')

menuButton.addEventListener('click', () => {
    groupModal.style.display = 'flex';
    groupModal.classList.remove('modal-hide');
});

function closeModal() {
    groupModal.classList.add('modal-hide');
    groupModal.addEventListener('animationend', () => {
        groupModal.style.display = 'none';
        if (groupChanged) { 
            groupChanged = false;
        }
    }, { once: true });
}

groupItems.forEach(item => {
    item.addEventListener('click', () => {
        selectedGroup = item.getAttribute('data-group');
        groupChanged = true;
        closeModal();
    });
});


closeModalButton.addEventListener('click', closeModal);
groupItems.forEach(item => {
    item.addEventListener('click', () => {
        selectedGroup = item.getAttribute('data-group');
        closeModal();
        updateTaskList(currentDate); 
    });
});

function updateTaskList(date) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    fetch('Расписание_осень_24_октябрь_V1.xlsx')
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            function jsDateToExcelDate(jsDate) {
                const excelEpoch = new Date(Date.UTC(1900, 0, 1)).getTime();
                const jsDateMillis = jsDate.getTime();
                return Math.floor((jsDateMillis - excelEpoch) / (1000 * 60 * 60 * 24)) + 2;
            }

            const targetDateValue = jsDateToExcelDate(new Date(dateKey));
            let targetRowIndex = -1;

            for (let i = 0; i < jsonData.length; i++) {
                const cellValue = jsonData[i][1]; 
                if (typeof cellValue === 'number' && cellValue === targetDateValue) {
                    targetRowIndex = i;
                    break;
                }
            }

            if (targetRowIndex !== -1) {
                const timeSlots = [
                    '9:00-10:30',
                    '10:40-12:10',
                    '13:20-14:50',
                    '15:00-16:30',
                    '16:40-18:10'
                ];

                const groupMapping = {
                    'ПМИ-2курс': [14, 15],
                    'Менеджмент-2курс': [12, 13],
                    'Юриспруденция-2курс': [16, 17],
                    'ПМИ-1курс': [3, 4],
                    'Менеджмент-1курс': [1, 2],
                    'Юриспруденция-1курс': [5, 6],
                    'Биотехнология-1курс': [7, 8],
                    'Фармация-1курс': [9, 10],
                };

                const [subjectCol, roomCol] = groupMapping[selectedGroup] || [1, 2]; 
                let isHoliday = true;

                for (let j = 0; j < timeSlots.length; j++) {
                    const row = jsonData[targetRowIndex + 2 + j];
                    const subject = row ? (row[subjectCol] !== undefined ? row[subjectCol] : ' ') : ' ';

                    if (typeof subject === 'string' && subject.trim() !== '') {
                        isHoliday = false;
                        break;
                    }
                }

                if (isHoliday) {
                    const weekendMessage = document.createElement('div');
                    weekendMessage.textContent = 'ВЫХОДНОЙ';
                    weekendMessage.style.fontSize = '30px';
                    weekendMessage.style.fontWeight = 'bold';
                    weekendMessage.style.textAlign = 'center';
                    weekendMessage.style.color = '#4e54c8';
                    weekendMessage.style.marginTop = '0px';
                    taskList.appendChild(weekendMessage);
                } else {
                    for (let j = 0; j < timeSlots.length; j++) {
                        const row = jsonData[targetRowIndex + 2 + j];
                        const li = document.createElement('li');
                        li.classList.add(`color-${(j % 5) + 1}`);

                        const subject = row ? (row[subjectCol] !== undefined ? row[subjectCol] : ' ') : ' ';
                        const room = row ? (row[roomCol] !== undefined ? row[roomCol] : ' ') : ' ';

                        li.innerHTML = `
                            <span>${timeSlots[j]}</span>
                            <span class="subject">${typeof subject === 'number' ? ' ' : subject}</span>
                            <span class="room">${room}</span>
                        `;

                        const currentTime = new Date();
                        const [startTime, endTime] = timeSlots[j].split('-').map(t => {
                            const [hours, minutes] = t.split(':').map(Number);
                            return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
                        });

                        if (currentTime >= startTime && currentTime < endTime) {
                            li.classList.add('active');
                            const checkmark = document.createElement('span');
                            checkmark.className = 'checkmark';
                            checkmark.innerHTML = '&#10003;';
                            li.appendChild(checkmark);
                        } else if (currentTime >= endTime) {
                            li.classList.add('completed');
                        }

                        taskList.appendChild(li);
                    }
                }
            } else {
                const weekendMessage = document.createElement('div');
                weekendMessage.textContent = 'ВЫХОДНОЙ';
                weekendMessage.style.fontSize = '30px';
                weekendMessage.style.fontWeight = 'bold';
                weekendMessage.style.textAlign = 'center';
                weekendMessage.style.color = '#4e54c8';
                weekendMessage.style.marginTop = '0px';
                taskList.appendChild(weekendMessage);
            }
        })
        .catch(error => console.error('Ошибка загрузки файла:', error));
}

fetch('Расписание_осень_24_октябрь_V1.xlsx')
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    })
    .catch(error => console.error('Ошибка загрузки файла:', error));

document.getElementById('lit').addEventListener('click', () => {
    if (!jsonData) {
        console.error('Данные из Excel не загружены');
        return;
    }

    const emptyPairsList = document.getElementById('emptyPairsList');
    emptyPairsList.innerHTML = '';

    const groupsToCheck = ['ПМИ-2курс', 'Юриспруденция-2курс', 'Менеджмент-2курс'];

    const groupMapping = {
        'ПМИ-2курс': [14, 15],
        'Менеджмент-2курс': [12, 13],
        'Юриспруденция-2курс': [16, 17]
    };

    let litcircl = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const currentTime = new Date();
    const pairTimes = [
        new Date().setHours(10, 30, 0), 
        new Date().setHours(12, 10, 0), 
        new Date().setHours(14, 50, 0), 
        new Date().setHours(16, 30, 0) 
    ];

    for (let i = 0; i < jsonData.length; i++) {
        const cellValue = jsonData[i][1];
        if (typeof cellValue !== 'number') continue;

        const excelDate = cellValue;
        const jsDate = new Date(Date.UTC(1900, 0, excelDate - 1));
        jsDate.setHours(0, 0, 0, 0); 

        if (jsDate < today) {
            continue;
        }

        let allGroupsHavePairs = true;
        groupsToCheck.forEach(group => {
            const [subjectCol] = groupMapping[group];
            let hasPair = false;

            for (let j = 0; j < 4; j++) {
                const row = jsonData[i + 2 + j];
                const subject = row ? (row[subjectCol] !== undefined ? row[subjectCol] : ' ') : ' ';

                if (subject && subject.trim() !== '') {
                    hasPair = true;
                    break;
                }
            }

            if (!hasPair) {
                allGroupsHavePairs = false;
            }
        });

        if (!allGroupsHavePairs) {
            continue;
        }

        for (let j = 0; j < 4; j++) {
            let emptyGroups = 0;

            if (jsDate.getTime() === today.getTime() && currentTime.getTime() > pairTimes[j]) {
                continue;
            }

            groupsToCheck.forEach(group => {
                const [subjectCol] = groupMapping[group];
                const row = jsonData[i + 2 + j];

                const subject = row ? (row[subjectCol] !== undefined ? row[subjectCol] : ' ') : ' ';
                if (!subject || subject.trim() === '') {
                    emptyGroups++;
                }
            });

            let li = document.createElement('li');
            let dateText = (jsDate.getTime() === today.getTime()) ? '▪︎_сегодня_▪︎' : jsDate.getDate().toString().padStart(2, '0') + '/' + (jsDate.getMonth() + 1).toString().padStart(2, '0') + '/' + jsDate.getFullYear();

            if (emptyGroups === 3) {
                li.style.color = 'gold';
                li.innerHTML = `<h3>${dateText} - ${j + 1}-я пара</h3>`;
            } else if (emptyGroups >= 2) {
                li.innerHTML = `<h3>${dateText} - ${j + 1}-я пара</h3>`;
            }

            if (emptyGroups >= 2) {
                emptyPairsList.appendChild(li);
                litcircl += 1;
            }
        }
    }


    if (litcircl < 1) {
        const li = document.createElement('li');
        li.innerHTML = `<h3>нет свободных пар</h3>`;
        emptyPairsList.appendChild(li);
    }

    emptyPairs.style.display = 'flex';  
});

document.getElementById('close-empty-pairs-modal').addEventListener('click', () => {
    emptyPairs.classList.add('modal-hide');
    
    emptyPairs.addEventListener('animationend', function handleAnimationEnd() {
        emptyPairs.style.display = 'none';
        emptyPairs.classList.remove('modal-hide'); 
        emptyPairs.removeEventListener('animationend', handleAnimationEnd);
    }, { once: true });
});

setInterval(() => {
    checkTaskCompletion();
}, 60000);

updateMonthName();
updateWeekdays();