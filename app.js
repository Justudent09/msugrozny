// Обработка Excel файла и вывод задач
document.getElementById('excel-file').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        displayTasks(json);
    };
});

function displayTasks(data) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; // Очистить предыдущие задачи

    // Пример: предполагаем, что первая строка содержит заголовки, а последующие строки — задачи
    for (let i = 1; i < data.length; i++) {
        const task = data[i];
        const time = task[0];
        const description = task[1];
        const status = task[2]; // Например, "Done", "In Progress", "Upcoming"

        const li = document.createElement('li');
        li.classList.add(status.toLowerCase().replace(' ', '-'));
        li.innerHTML = `<span>${time}</span> <span>${description}</span>`;
        taskList.appendChild(li);
    }
}