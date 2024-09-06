let tg = window.Telegram.WebApp;
let usercard = document.getElementById("usercard");
let h1 = document.createElement("h1");
h1.innerText = `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name},`;
usercard.appendChild(h1);

let schedule = {};

// Функция для загрузки файла Excel
document.getElementById("excelFile").addEventListener("change", function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Преобразуем данные Excel в формат расписания
        parseExcelData(excelData);
    };

    reader.readAsArrayBuffer(file);
});

// Функция для преобразования данных из Excel
function parseExcelData(excelData) {
    schedule = {};
    
    // Предположим, что данные расписания начинаются со 2-й строки
    for (let i = 1; i < excelData.length; i++) {
        const row = excelData[i];
        const date = row[0]; // Дата
        const subject = row[1]; // Пара
        const room = row[2]; // Аудитория

        if (!schedule[date]) {
            schedule[date] = [];
        }

        schedule[date].push({ subject, room });
    }

    // После парсинга обновляем расписание для пользователя
    checkUserData();
}

// Функция для проверки, сохранены ли данные пользователя
function checkUserData() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        const userCourse = localStorage.getItem('course');
        const userDirection = localStorage.getItem('direction');
        showSchedule(userCourse, userDirection);
        document.getElementById('contact').classList.add('hidden');
        document.getElementById('deleteButton').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }
}

// Функция для отображения расписания
function showSchedule(course, direction) {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysContainer = document.getElementById("daysContainer");
    daysContainer.innerHTML = '';
    const appealText = document.getElementById("appealText");
    const contour = document.getElementById("contour");

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let activeDayDiv;

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    }

    function updateCouples(dateKey) {
        const couples = schedule[dateKey] || [];
        let coupleCount = 0;

        contour.innerHTML = '';
        const times = ["09:00", "10:40", "13:20", "15:00", "16:40"];

        for (let i = 0; i < couples.length; i++) {
            if (couples[i]) {
                const c1 = document.createElement('div');
                c1.className = 'c1';
                const time = document.createElement('p');
                time.className = 'time';
                time.textContent = times[i];

                const coupleDiv = document.createElement('div');
                coupleDiv.className = 'couple';
                coupleDiv.id = `couple${i + 1}`;

                const subject = document.createElement('p');
                subject.className = 'subject';
                subject.textContent = couples[i].subject || "Нет пары";

                const room = document.createElement('p');
                room.className = 'room';
                room.textContent = couples[i].room || "Аудитория неизвестна";

                coupleDiv.appendChild(subject);
                coupleDiv.appendChild(room);
                c1.appendChild(time);
                c1.appendChild(coupleDiv);
                contour.appendChild(c1);

                coupleCount++;
            }
        }

        if (coupleCount === 0) {
            const noCouplesDiv = document.createElement('div');
            noCouplesDiv.className = 'no-couples';
            noCouplesDiv.textContent = 'Нет пар на этот день.';
            contour.appendChild(noCouplesDiv);
        }
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dayName = dayNames[date.getDay()];
        const dayDiv = document.createElement("div");
        dayDiv.className = "day";

        if (day === now.getDate()) {
            dayDiv.classList.add("active");
            activeDayDiv = dayDiv;
        }

        const dayLabel = document.createElement("p");
        dayLabel.className = "day-name";
        dayLabel.textContent = dayName;

        const dateLabel = document.createElement("p");
        dateLabel.className = "date-number";
        dateLabel.textContent = day;

        dayDiv.appendChild(dayLabel);
        dayDiv.appendChild(dateLabel);
        daysContainer.appendChild(dayDiv);

        const dateKey = formatDate(date);

        dayDiv.addEventListener("click", () => {
            if (activeDayDiv) {
                activeDayDiv.classList.remove("active");
            }
            dayDiv.classList.add("active");
            activeDayDiv = dayDiv;

            updateCouples(dateKey);
        });

        if (day === now.getDate()) {
            updateCouples(dateKey);
        }
    }

    appealText.textContent = `Ваше расписание на ${now.toLocaleString("ru-RU", { month: "long" })} ${now.getFullYear()}`;
}
