let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
let formulas = JSON.parse(localStorage.getItem('formulas')) || [];
let quizHistory = JSON.parse(localStorage.getItem('quizHistory')) || [];
let quizQuestions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let timerInterval;
let timeLeft = 120;
let userAnswers = [];

document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            tabButtons.forEach(btn => {
                btn.classList.remove('text-indigo-600', 'border-indigo-600');
                btn.classList.add('text-gray-500', 'border-transparent');
            });
            
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            this.classList.remove('text-gray-500', 'border-transparent');
            this.classList.add('text-indigo-600', 'border-indigo-600');
            
            // Hide mobile menu when tab is clicked
            document.getElementById('mobile-menu').classList.add('hidden');
        });
    });
    
    tabButtons[0].classList.remove('text-gray-500', 'border-transparent');
    tabButtons[0].classList.add('text-indigo-600', 'border-indigo-600');
    
    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
    
    document.getElementById('add-subject').addEventListener('click', addSubject);
    document.getElementById('update-progress').addEventListener('click', updateProgress);
    document.getElementById('start-quiz').addEventListener('click', startQuiz);
    document.getElementById('quiz-next').addEventListener('click', nextQuestion);
    document.getElementById('quiz-prev').addEventListener('click', prevQuestion);
    document.getElementById('quiz-restart').addEventListener('click', resetQuiz);
    document.getElementById('add-formula-btn').addEventListener('click', showFormulaModal);
    document.getElementById('cancel-formula').addEventListener('click', hideFormulaModal);
    document.getElementById('save-formula').addEventListener('click', saveFormula);
    document.getElementById('formula-search').addEventListener('input', searchFormulas);
    
    renderSubjects();
    updateOverallProgress();
    renderSubjectOptions();
    renderFormulas();
    loadSampleQuizQuestions();
});

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString('vi-VN', options);
    const timeString = now.toLocaleTimeString('vi-VN', { hour12: false });
    document.getElementById('current-date').textContent = dateString;
    document.getElementById('mobile-current-date').textContent = dateString;
    document.getElementById('current-time').textContent = timeString;
    document.getElementById('mobile-current-time').textContent = timeString;
}

function addSubject() {
    const subjectName = document.getElementById('subject-name').value.trim();
    if (!subjectName) {
        Toastify({
            text: "Vui lòng nhập tên môn học!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    if (subjects.some(subject => subject.name.toLowerCase() === subjectName.toLowerCase())) {
        Toastify({
            text: "Môn học này đã tồn tại!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    const newSubject = {
        id: Date.now(),
        name: subjectName,
        progress: 0
    };
    
    subjects.push(newSubject);
    saveSubjects();
    renderSubjects();
    renderSubjectOptions();
    document.getElementById('subject-name').value = '';
    Toastify({
        text: `Đã thêm môn "${subjectName}" thành công!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#10b981",
    }).showToast();
}

function renderSubjects() {
    const container = document.getElementById('subjects-list');
    container.innerHTML = '';
    
    subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'card bg-white border border-gray-200 rounded-lg p-4 shadow-sm';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium text-gray-900">${subject.name}</h3>
                <button class="delete-subject text-red-500 hover:text-red-700" data-id="${subject.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="mb-2">
                <p class="text-sm font-medium text-gray-700 mb-1">Tiến độ: ${subject.progress}%</p>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full progress-bar" style="width: ${subject.progress}%"></div>
                </div>
            </div>
            <div class="text-right text-xs text-gray-500">
                Cập nhật lần cuối: ${new Date(subject.id).toLocaleDateString('vi-VN')}
            </div>
        `;
        container.appendChild(card);
    });
    
    document.querySelectorAll('.delete-subject').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteSubject(id);
        });
    });
}

function deleteSubject(id) {
    const subject = subjects.find(s => s.id === id);
    subjects = subjects.filter(subject => subject.id !== id);
    saveSubjects();
    renderSubjects();
    renderSubjectOptions();
    updateOverallProgress();
    Toastify({
        text: `Đã xóa môn "${subject.name}"!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ef4444",
    }).showToast();
}

function updateProgress() {
    const subjectId = parseInt(document.getElementById('progress-subject').value);
    const progressValue = parseInt(document.getElementById('progress-value').value);
    
    if (!subjectId || isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
        Toastify({
            text: "Vui lòng chọn môn học và nhập tiến độ hợp lệ (0-100)!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
        subject.progress = progressValue;
        saveSubjects();
        renderSubjects();
        updateOverallProgress();
        document.getElementById('progress-value').value = '';
        
        const progressBar = document.querySelector(`[data-id="${subjectId}"]`).closest('.bg-white').querySelector('.progress-bar');
        progressBar.style.width = '0';
        setTimeout(() => {
            progressBar.style.width = progressValue + '%';
        }, 10);
        
        Toastify({
            text: `Cập nhật tiến độ "${subject.name}" thành ${progressValue}%!`,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#10b981",
        }).showToast();
    }
}

function updateOverallProgress() {
    if (subjects.length === 0) {
        document.getElementById('overall-progress').style.width = '0%';
        return;
    }
    
    const totalProgress = subjects.reduce((sum, subject) => sum + subject.progress, 0);
    const averageProgress = totalProgress / subjects.length;
    
    const overallProgress = document.getElementById('overall-progress');
    overallProgress.style.width = averageProgress + '%';
}

function renderSubjectOptions() {
    const subjectSelects = [
        document.getElementById('progress-subject'),
        document.getElementById('formula-subject')
    ];
    
    subjectSelects.forEach(select => {
        const selectedValue = select.value;
        select.innerHTML = `<option value="">-- Chọn môn học --</option>`;
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            select.appendChild(option);
        });
        
        if (selectedValue && subjects.some(s => s.id === parseInt(selectedValue))) {
            select.value = selectedValue;
        }
    });
    
    updateSubjectProgressChart();
}

function loadSampleQuizQuestions() {
    const sampleQuestions = {
        math: [
            {
                question: "Đạo hàm của hàm số f(x) = x² là gì?",
                options: ["2x", "x", "2x²", "x³/3"],
                answer: 0
            },
            {
                question: "Giải phương trình bậc hai x² - 5x + 6 = 0",
                options: ["x=2, x=3", "x=-2, x=-3", "x=1, x=6", "x=-1, x=-6"],
                answer: 0
            }
        ],
        physics: [
            {
                question: "Công thức tính công cơ học là gì?",
                options: ["A = F.s", "A = F/s", "A = F.s.cosα", "A = m.v"],
                answer: 2
            },
            {
                question: "Định luật Ohm phát biểu rằng:",
                options: ["I = U.R", "U = I.R", "R = I.U", "P = U.I"],
                answer: 1
            }
        ],
        chemistry: [
            {
                question: "Công thức hóa học của axit sunfuric là:",
                options: ["H2SO4", "HCl", "HNO3", "H3PO4"],
                answer: 0
            },
            {
                question: "Nguyên tố nào có số hiệu nguyên tử bằng 1?",
                options: ["Heli", "Hydro", "Oxy", "Natri"],
                answer: 1
            }
        ]
    };
    quizQuestions = sampleQuestions;
}

function startQuiz() {
    const category = document.getElementById('quiz-category').value;
    const count = parseInt(document.getElementById('quiz-count').value);
    
    if (!category) {
        Toastify({
            text: "Vui lòng chọn chủ đề!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    if (!quizQuestions[category] || quizQuestions[category].length === 0) {
        Toastify({
            text: "Không có câu hỏi nào cho chủ đề này!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    timeLeft = 120;
    userAnswers = [];
    
    const shuffledQuestions = [...quizQuestions[category]].sort(() => 0.5 - Math.random()).slice(0, count);
    
    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-results').classList.add('hidden');
    
    showQuestion(shuffledQuestions, currentQuestion);
    
    clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishQuiz(shuffledQuestions);
        }
    }, 1000);
}

function showQuestion(questions, index) {
    const question = questions[index];
    document.getElementById('quiz-question').textContent = question.question;
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, i) => {
        const optionElement = document.createElement('div');
        const isSelected = typeof userAnswers[index] !== 'undefined' && userAnswers[index] === i;
        const isCorrect = i === question.answer;
        let classes = 'option p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50';
        
        if (typeof userAnswers[index] !== 'undefined') {
            if (isSelected && isCorrect) {
                classes += ' bg-green-100 border-green-300';
            } else if (isSelected && !isCorrect) {
                classes += ' bg-red-100 border-red-300';
            } else if (!isSelected && isCorrect) {
                classes += ' bg-green-50 border-green-200';
            }
        }
        
        optionElement.className = classes;
        optionElement.innerHTML = `
            ${String.fromCharCode(65 + i)}. ${option}
            ${isSelected && isCorrect ? '<i class="fas fa-check ml-2 text-green-500 float-right"></i>' : ''}
            ${isSelected && !isCorrect ? '<i class="fas fa-times ml-2 text-red-500 float-right"></i>' : ''}
        `;
        
        optionElement.addEventListener('click', () => selectAnswer(questions, index, i));
        optionsContainer.appendChild(optionElement);
    });
    
    document.getElementById('quiz-progress').textContent = `Câu ${index + 1}/${questions.length}`;
    document.getElementById('quiz-score').textContent = `Điểm: ${score}`;
    document.getElementById('quiz-prev').classList.toggle('hidden', index === 0);
    document.getElementById('quiz-next').textContent = index === questions.length - 1 ? 'Kết Thúc' : 'Câu tiếp';
}

function selectAnswer(questions, questionIndex, optionIndex) {
    if (typeof userAnswers[questionIndex] !== 'undefined') {
        return;
    }
    
    userAnswers[questionIndex] = optionIndex;
    
    const isCorrect = optionIndex === questions[questionIndex].answer;
    if (isCorrect) {
        correctAnswers++;
        score += Math.floor(100 / questions.length);
        Toastify({
            text: "Đáp án đúng!",
            duration: 1500,
            gravity: "top",
            position: "right",
            backgroundColor: "#10b981",
        }).showToast();
    } else {
        Toastify({
            text: "Đáp án sai! Đáp án đúng là: " + questions[questionIndex].options[questions[questionIndex].answer],
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
    }
    
    showQuestion(questions, questionIndex);
    
    if (questionIndex < questions.length - 1 && questions.length <= 10) {
        setTimeout(() => {
            nextQuestion(questions);
        }, 800);
    }
}

function nextQuestion(questions) {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion(questions, currentQuestion);
    } else {
        finishQuiz(questions);
    }
}

function prevQuestion(questions) {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(questions, currentQuestion);
    }
}

function finishQuiz(questions) {
    clearInterval(timerInterval);
    
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    
    document.getElementById('correct-answers').textContent = correctAnswers;
    document.getElementById('total-questions').textContent = questions.length;
    document.getElementById('final-score').textContent = score;
    
    const result = {
        date: new Date().getTime(),
        category: document.getElementById('quiz-category').value,
        correct: correctAnswers,
        total: questions.length,
        score: score
    };
    
    quizHistory.push(result);
    localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
    
    updateQuizHistoryChart();
    Toastify({
        text: `Hoàn thành bài trắc nghiệm! Điểm: ${score}/100`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#3b82f6",
    }).showToast();
}

function resetQuiz() {
    document.getElementById('quiz-results').classList.add('hidden');
    document.getElementById('quiz-setup').classList.remove('hidden');
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('quiz-timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 10) {
        document.getElementById('quiz-timer').classList.add('text-red-500');
    } else {
        document.getElementById('quiz-timer').classList.remove('text-red-500');
    }
}

function showFormulaModal() {
    document.getElementById('formula-modal').classList.remove('hidden');
}

function hideFormulaModal() {
    document.getElementById('formula-modal').classList.add('hidden');
    document.getElementById('formula-title').value = '';
    document.getElementById('formula-subject').value = '';
    document.getElementById('formula-content').value = '';
}

function saveFormula() {
    const title = document.getElementById('formula-title').value.trim();
    const subjectId = parseInt(document.getElementById('formula-subject').value);
    const content = document.getElementById('formula-content').value.trim();
    
    if (!title || !subjectId || !content) {
        Toastify({
            text: "Vui lòng điền đầy đủ thông tin công thức!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) {
        Toastify({
            text: "Môn học không tồn tại!",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#ef4444",
        }).showToast();
        return;
    }
    
    const newFormula = {
        id: Date.now(),
        title,
        subjectId,
        subjectName: subject.name,
        content,
        createdAt: new Date().getTime()
    };
    
    formulas.push(newFormula);
    saveFormulas();
    renderFormulas();
    hideFormulaModal();
    updateRecentFormulas();
    Toastify({
        text: `Đã thêm công thức "${title}"!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#10b981",
    }).showToast();
}

function renderFormulas(searchTerm = '') {
    const container = document.getElementById('formulas-list');
    container.innerHTML = '';
    
    let filteredFormulas = [...formulas];
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredFormulas = formulas.filter(formula => 
            formula.title.toLowerCase().includes(term) || 
            formula.content.toLowerCase().includes(term) ||
            formula.subjectName.toLowerCase().includes(term)
        );
    }
    
    if (filteredFormulas.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-2 text-center py-4">Không tìm thấy công thức nào</p>';
        return;
    }
    
    filteredFormulas.sort((a, b) => b.createdAt - a.createdAt).forEach(formula => {
        const card = document.createElement('div');
        card.className = 'card bg-white border border-gray-200 rounded-lg p-4 shadow-sm';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-medium text-gray-900">${formula.title}</h3>
                <button class="delete-formula text-red-500 hover:text-red-700" data-id="${formula.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="flex items-center text-sm text-gray-500 mb-2">
                <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-2">${formula.subjectName}</span>
                <span>${new Date(formula.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="text-gray-700 whitespace-pre-line">${formula.content}</div>
        `;
        container.appendChild(card);
    });
    
    document.querySelectorAll('.delete-formula').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteFormula(id);
        });
    });
    
    updateRecentFormulas();
}

function deleteFormula(id) {
    const formula = formulas.find(f => f.id === id);
    formulas = formulas.filter(formula => formula.id !== id);
    saveFormulas();
    renderFormulas();
    updateRecentFormulas();
    Toastify({
        text: `Đã xóa công thức "${formula.title}"!`,
        duration: 3000,
        gravity: "top",
        position: "right",
        backgroundColor: "#ef4444",
    }).showToast();
}

function searchFormulas() {
    const searchTerm = document.getElementById('formula-search').value.trim();
    renderFormulas(searchTerm);
}

function updateSubjectProgressChart() {
    const container = document.getElementById('subject-progress-chart');
    container.innerHTML = '';
    
    if (subjects.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Không có dữ liệu môn học</p>';
        return;
    }
    
    const sortedSubjects = [...subjects].sort((a, b) => b.progress - a.progress);
    
    sortedSubjects.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'flex items-center';
        item.innerHTML = `
            <span class="w-1/4 text-sm font-medium text-gray-700 truncate">${subject.name}</span>
            <div class="w-2/4 bg-gray-200 rounded-full h-2.5 mx-2">
                <div class="bg-indigo-600 h-2.5 rounded-full progress-bar" style="width: ${subject.progress}%"></div>
            </div>
            <span class="w-1/4 text-right text-sm font-medium text-gray-700">${subject.progress}%</span>
        `;
        container.appendChild(item);
    });
}

function updateQuizHistoryChart() {
    const container = document.getElementById('quiz-history-chart');
    
    if (quizHistory.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Không có dữ liệu trắc nghiệm</p>';
        return;
    }
    
    const recentResults = [...quizHistory].reverse().slice(0, 5);
    
    let chartHTML = '<div class="flex h-full items-end space-x-4">';
    const maxScore = 100;
    const heightFactor = 200 / maxScore;
    
    recentResults.forEach((result, index) => {
        const height = Math.max(10, result.score * heightFactor);
        const color = index === recentResults.length - 1 ? 'bg-indigo-600' : 'bg-indigo-300';
        const tooltip = `Lần ${index + 1}: ${result.score} điểm - ${new Date(result.date).toLocaleDateString('vi-VN')}`;
        
        chartHTML += `
            <div class="flex flex-col items-center" style="flex: 1;">
                <div class="w-full ${color} rounded-t-md hover:opacity-80 transition-opacity relative group" style="height: ${height}px;" title="${tooltip}">
                    <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">${result.score}%</span>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div>';
    container.innerHTML = chartHTML;
}

function updateRecentFormulas() {
    const container = document.getElementById('recent-formulas');
    container.innerHTML = '';
    
    const recentFormulas = [...formulas].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    
    if (recentFormulas.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-3 text-center py-4">Không có công thức nào</p>';
        return;
    }
    
    recentFormulas.forEach(formula => {
        const card = document.createElement('div');
        card.className = 'card bg-white border border-gray-200 rounded-lg p-3 shadow-sm';
        card.innerHTML = `
            <h4 class="font-medium text-gray-900 text-sm mb-1 truncate">${formula.title}</h4>
            <div class="flex items-center text-xs text-gray-500 mb-2">
                <span class="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded mr-1">${formula.subjectName}</span>
                <span class="text-xs">${new Date(formula.createdAt).toLocaleDateString('vi-VN')}</span>
            </div>
            <p class="text-gray-600 text-xs line-clamp-2">${formula.content}</p>
        `;
        container.appendChild(card);
    });
}

function saveSubjects() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

function saveFormulas() {
    localStorage.setItem('formulas', JSON.stringify(formulas));
}
