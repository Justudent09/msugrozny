let tg = window.Telegram.WebApp;
let usercard = document.getElementById("usercard");
let h1 = document.createElement("h1");
h1.innerText = `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name},`;
usercard.appendChild(h1);


// Глобальная переменная для расписания
let schedule = {};

// Функция для проверки, сохранены ли данные пользователя
function checkUserData() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        const userCourse = localStorage.getItem('course');
        const userDirection = localStorage.getItem('direction');
        showSchedule(userCourse, userDirection);
        // Скрываем форму и показываем кнопку удаления, если данные уже сохранены
        document.getElementById('contact').classList.add('hidden');
        document.getElementById('deleteButton').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    }
}

// Функция для отображения расписания
function showSchedule(course, direction) {
    const schedules = [
        {
            course: "1",
            direction: "management",
            schedule: {
                "01/06/24": [
                    { subject: "Иностранный язык", room: "А1" },
                    { subject: "Иностранный язык", room: "А1" },
                ],
                "03/06/24": [
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Физическая культура" }
                ],
                "04/06/24": [
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Иностранный язык", room: "А1" }
                ],
                "05/06/24": [
                    { subject: "Иностранный язык", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Математика для менеджеров", room: "А1" },
                    { subject: "Физическая культура" }
                ],
                "06/06/24": [
                    { subject: "Иностранный язык", room: "А1" },
                    { subject: "Иностранный язык", room: "А1" },
                    { subject: "Иностранный язык", room: "А1" }
                ],
                "07/06/24": [
                    { subject: "Иностранный язык", room: "А1" }
                ]
            }
        },
        {
            course: "1",
            direction: "pmi",
            schedule: {
                "01/06/24": [
                    { subject: "Иностранный язык", room: "А2" }
                ],
                "03/06/24": [
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Физическая культура" }
                ],
                "04/06/24": [
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Иностранный язык", room: "А2" }
                ],
                "05/06/24": [
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Физическая культура" }
                ],
                "06/06/24": [
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Иностранный язык", room: "А2" }
                ],
                "07/06/24": [
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" },
                    { subject: "Дискретная математика", room: "А2" }
                ]
            }
        },
        {
            course: "1",
            direction: "jurisprudence",
            schedule: {
                "01/06/24": [
                    { subject: "Противоправное поведение и правонарушение", room: "Л1" },
                    { subject: "Противоправное поведение и правонарушение", room: "Л1" },
                    { subject: "Противоправное поведение и правонарушение", room: "Л1" },
                    { subject: "Иностранный язык", room: "Л1" }
                ],
                "03/06/24": [
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "Физическая культура" }
                ],
                "04/06/24": [
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "Иностранный язык", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" }
                ],
                "05/06/24": [
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "Физическая культура" }
                ],
                "06/06/24": [
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" }
                ],
                "07/06/24": [
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" },
                    { subject: "ИОГП", room: "Л1" }
                ]
            }
        }
    ];

    let foundSchedule = schedules.find(s => s.course === course && s.direction === direction);

    if (foundSchedule) {
        schedule = foundSchedule.schedule; // Сохраняем найденное расписание в глобальную переменную
    } else {
        console.error('Расписание не найдено для указанного курса и направления');
        return;
    }

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
                coupleDiv.textContent = couples[i].subject;

                const roomDiv = document.createElement('div');
                roomDiv.className = 'room';
                roomDiv.textContent = couples[i].room || '';
                roomDiv.style.position = 'absolute';
                roomDiv.style.bottom = '5%';
                roomDiv.style.right = '5%';
                roomDiv.style.fontSize = '150%';

                coupleDiv.appendChild(roomDiv);
                c1.appendChild(time);
                c1.appendChild(coupleDiv);
                contour.appendChild(c1);

                coupleCount++;
            }
        }

        if (coupleCount === 0) {
            contour.innerHTML = '<div class="day-off">ВЫХОДНОЙ</div>';
        }

        return coupleCount;
    }

    function updateAppealText(coupleCount) {
        switch (coupleCount) {
            case 0:
                appealText.textContent = "сегодня у вас выходной";
                break;
            case 1:
                appealText.textContent = "сегодня у вас одна пара";
                break;
            case 2:
                appealText.textContent = "сегодня у вас две пары";
                break;
            case 3:
                appealText.textContent = "сегодня у вас три пары";
                break;
            case 4:
                appealText.textContent = "сегодня у вас четыре пары";
                break;
            case 5:
                appealText.textContent = "сегодня у вас пять пар";
                break;
        }
    }

    const todayDateKey = formatDate(now);
    const todayCouples = schedule[todayDateKey] || [];
    const todayCoupleCount = updateCouples(todayDateKey);
    updateAppealText(todayCoupleCount);

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("my-div");

        const circleDiv = document.createElement("div");
        circleDiv.classList.add("circle");
        circleDiv.textContent = i;

        const dayName = document.createElement("p");
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dateKey = formatDate(date);
        dayName.textContent = dayNames[date.getDay()];

        dayDiv.appendChild(circleDiv);
        dayDiv.appendChild(dayName);
        daysContainer.appendChild(dayDiv);

        if (i === now.getDate()) {
            dayDiv.classList.add('active');
            circleDiv.style.background = 'linear-gradient(#B4B2E2, #9293DF)';
            dayDiv.style.color = 'white';
            activeDayDiv = dayDiv;

            updateCouples(dateKey);
        }

        dayDiv.addEventListener('click', function() {
            if (activeDayDiv) {
                activeDayDiv.classList.remove('active');
                activeDayDiv.querySelector('.circle').style.background = '#28272C';
                activeDayDiv.style.color = '#5D5C61';
            }

            this.classList.add('active');
            this.querySelector('.circle').style.background = 'linear-gradient(#B4B2E2, #9293DF)';
            this.style.color = 'white';
            activeDayDiv = this;

            const selectedDateKey = formatDate(new Date(now.getFullYear(), now.getMonth(), i));
            updateCouples(selectedDateKey);
        });
    }

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const year = now.getFullYear();
    const monthName = monthNames[now.getMonth()];
    const currentDate = `${monthName}, ${year}`;

    document.getElementById("currentDateDiv").innerText = currentDate;

    // Добавляем прокрутку к активному элементу после его создания
    if (activeDayDiv) {
        setTimeout(() => {
            const index = Array.prototype.indexOf.call(daysContainer.children, activeDayDiv);
            const offset = Math.max(index - 1, 0);
            daysContainer.scrollLeft = daysContainer.children[offset].offsetLeft - daysContainer.offsetWidth / 2 + activeDayDiv.offsetWidth / 2;
        }, 100); // 100 мс задержки перед прокруткой
    }

    const notificationsDiv = document.querySelector('.notifications');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const overlay = document.getElementById('overlay');

    notificationsDiv.addEventListener('click', function(event) {
        notificationsPanel.classList.toggle('show');
        overlay.classList.toggle('show');
        document.body.classList.toggle('no-scroll');
        event.stopPropagation();
    });

    overlay.addEventListener('click', function() {
        notificationsPanel.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('no-scroll');
    });

    notificationsPanel.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    const profileIcon = document.querySelector('.icon-profile');
    const deleteButton = document.getElementById('deleteButton');
    deleteButton.style.display = 'none';
    deleteButton.addEventListener('click', function() {
        localStorage.clear();

        location.reload();
    });

    profileIcon.addEventListener('click', function() {
        deleteButton.style.display = 'block'; // Показать кнопку при нажатии на иконку профиля
    });
    
    // Получаем элементы
const modal = document.getElementById("myModal");
const btn = document.getElementById("openModalBtn");
const span = document.getElementsByClassName("close")[0];

// Когда пользователь нажимает на кнопку, открываем модальное окно
btn.onclick = function() {
    modal.style.display = "block";
}

// Когда пользователь нажимает в любом месте вне модального окна, закрываем его
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
}

// Обработчик отправки формы пользователя
document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const course = document.getElementById('course').value;
    const direction = document.getElementById('direction').value;
    const password = document.getElementById('password').value;

    // Проверка пароля
    if (password === 'Studyme@1972') {
        const userId = 'user-telegram-id'; // Замените на реальный ID пользователя Telegram
        saveUserId(userId, course, direction);
        showSchedule(course, direction);
        // Скрываем форму и показываем кнопку удаления после ввода данных
           document.getElementById('contact').classList.add('hidden');
        document.getElementById('deleteButton').classList.remove('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    } else {
        alert('Неверный пароль');
    }
});

// Функция для сохранения ID пользователя
function saveUserId(userId, course, direction) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = { id: userId, course: course, direction: direction };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('userId', userId);
    localStorage.setItem('course', course);
    localStorage.setItem('direction', direction);
}

// Обработчик удаления данных
document.getElementById('deleteButton').addEventListener('click', function() {
    const userId = localStorage.getItem('userId');
    deleteUserId(userId);

    document.getElementById('contact').classList.remove('hidden');
    document.getElementById('deleteButton').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('daysContainer').innerHTML = '';
    document.getElementById('contour').innerHTML = '';
});

// Функция для удаления ID пользователя
function deleteUserId(userId) {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(user => user.id !== userId);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.removeItem('userId');
    localStorage.removeItem('course');
    localStorage.removeItem('direction');
}

// Проверка данных пользователя при загрузке страницы
window.onload = function() {
    checkUserData();
}
