function updateMonthName() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthNameElement = document.getElementById('month-name');
    monthNameElement.textContent = `${monthNames[currentDate.getMonth()]}, ${currentDate.getFullYear()}`;
}

function updateWeekdays() {
    const weekdaysContainer = document.getElementById('weekdays');
    weekdaysContainer.innerHTML = ''; 

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
let currentDate = new Date();
let selectedGroup = ''; 

const menuButton = document.getElementById('menu-button');
const groupModal = document.getElementById('group-modal');
const closeModalButton = document.getElementById('close-modal');
const groupItems = document.querySelectorAll('.group-item');
const uploadInput = document.getElementById('upload');

menuButton.addEventListener('click', () => {
    groupModal.style.display = 'flex';
    groupModal.classList.remove('modal-hide');
});
let groupChanged = false;

let tg = window.Telegram.WebApp;
let telegramID = tg.initDataUnsafe.user.id; // Извлечение ID пользователя

document.addEventListener('DOMContentLoaded', () => {
    const savedGroup = localStorage.getItem(`selectedGroup_${telegramID}`);
    if (savedGroup) {
        selectedGroup = savedGroup;
        updateTaskList(currentDate);
    }
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

        // Сохраняем выбранную группу в localStorage
        localStorage.setItem(`selectedGroup_${telegramID}`, selectedGroup);

        closeModal();
        updateTaskList(currentDate); 
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

    fetch('Расписание_осень_24_октябрь_v1.xlsx')
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

            // Поиск строки, соответствующей выбранной дате
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
                let isHoliday = true; // Изначально предполагаем, что все слоты пусты

                // Перебираем временные слоты и формируем элементы списка
                for (let j = 0; j < timeSlots.length; j++) {
                    const row = jsonData[targetRowIndex + 2 + j];
                    const subject = row ? (row[subjectCol] !== undefined ? row[subjectCol] : ' ') : ' ';

                    if (typeof subject === 'string' && subject.trim() !== '') {
                        isHoliday = false; // Если найден непустой предмет, то это не выходной
                        break;
                    }
                }

                if (isHoliday) {
                    // Показ сообщения "Выходной", если нет данных на эту дату
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
                // Показ сообщения "Выходной", если нет данных на эту дату
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

setInterval(() => {
    checkTaskCompletion();
}, 60000);

updateMonthName();
updateWeekdays();