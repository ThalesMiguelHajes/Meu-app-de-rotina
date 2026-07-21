// Configuração dos dados no LocalStorage
let state = JSON.parse(localStorage.getItem('app_foco_state')) || {
  streak: 0,
  lastDate: null,          // Última data em que abriu o app ('YYYY-MM-DD')
  completedTodayDate: null, // Data em que ganhou +1 na ofensiva ('YYYY-MM-DD')
  masterTasks: [],         // Lista fixa de atividades diárias habilitadas
  todayTasks: [],          // [{ id, text, done }] do dia atual
  lastCelebratedStreak: 0, // Guardar última ofensiva em que disparou a celebração de 5 dias
  completedDays: []        // Array de datas concluídas ['YYYY-MM-DD', ...]
};

if (!state.completedDays) {
  state.completedDays = [];
}

// Sugestões padrão com ícones
const defaultSuggestions = [
  "Beber 2L de água 💧",
  "Ler 10 páginas 📖",
  "Treinar / Exercício 💪",
  "Meditação / Relaxar 🧘‍♂️",
  "Arrumar a cama 🛏️",
  "Tempo de qualidade juntos ❤️",
  "Estudar 30 min 📚",
  "Skin care ✨"
];

let currentCalendarDate = new Date();

function saveState() {
  localStorage.setItem('app_foco_state', JSON.stringify(state));
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Inicialização do dia / Passagem da meia-noite (00:00)
function initDayCheck() {
  const today = getTodayString();

  // Se for um novo dia (mudou a data)
  if (state.lastDate !== today) {
    if (state.lastDate !== null) {
      // Verifica se o dia anterior foi concluído com sucesso
      const allCompletedYesterday = state.todayTasks.length > 0 && state.todayTasks.every(t => t.done);
      if (!allCompletedYesterday && state.completedTodayDate !== state.lastDate) {
        state.streak = 0;
      }
    }

    // Reinicia a lista de tarefas para o novo dia com base no cadastro fixo
    state.todayTasks = state.masterTasks.map(t => ({
      id: t.id,
      text: t.text,
      done: false
    }));

    state.lastDate = today;
    saveState();
  }
}

// Verifica se atingiu a meta de 5 dias e abre a janela de parabéns
function checkGoalCelebration() {
  if (state.streak > 0 && state.streak % 5 === 0 && state.lastCelebratedStreak !== state.streak) {
    state.lastCelebratedStreak = state.streak;
    saveState();
    setTimeout(() => {
      const modal = document.getElementById('congratsModal');
      if (modal) modal.classList.add('active');
    }, 300);
  }
}

function closeCongratsModal() {
  const modal = document.getElementById('congratsModal');
  if (modal) modal.classList.remove('active');
  render();
}

// Atualiza lógica da ofensiva com base na lista de hoje
function updateStreakLogic() {
  const today = getTodayString();
  const hasTasks = state.todayTasks.length > 0;
  const allDone = hasTasks && state.todayTasks.every(t => t.done);

  if (allDone) {
    // Se concluiu todas e ainda não pontuou hoje
    if (state.completedTodayDate !== today) {
      state.streak += 1;
      state.completedTodayDate = today;
      if (!state.completedDays.includes(today)) {
        state.completedDays.push(today);
      }
      checkGoalCelebration();
    }
  } else {
    // Se NÃO concluiu todas, mas já tinha pontuado hoje (ex: adicionou nova tarefa)
    if (state.completedTodayDate === today) {
      state.streak = Math.max(0, state.streak - 1);
      state.completedTodayDate = null;
      state.completedDays = state.completedDays.filter(d => d !== today);
    }
  }

  saveState();
  render();
}

// Alternar recolher/expandir seções de hoje
function togglePendingCollapse() {
  const contentEl = document.getElementById('pendingTaskList');
  const btnEl = document.getElementById('pendingCollapseBtn');
  if (contentEl && btnEl) {
    contentEl.classList.toggle('collapsed');
    btnEl.classList.toggle('collapsed');
  }
}

function toggleCompletedCollapse() {
  const contentEl = document.getElementById('completedTaskList');
  const btnEl = document.getElementById('completedCollapseBtn');
  if (contentEl && btnEl) {
    contentEl.classList.toggle('collapsed');
    btnEl.classList.toggle('collapsed');
  }
}

// Alternar recolher/expandir sugestões
function toggleSuggestionsCollapse() {
  const contentEl = document.getElementById('defaultTaskList');
  const btnEl = document.getElementById('collapseBtn');
  if (contentEl && btnEl) {
    contentEl.classList.toggle('collapsed');
    btnEl.classList.toggle('collapsed');
  }
}

// Alternar entre abas
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

  if (tabName === 'today') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('viewToday').classList.add('active');
  } else if (tabName === 'calendar') {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('viewCalendar').classList.add('active');
    renderCalendar();
  } else {
    document.querySelectorAll('.tab-btn')[2].classList.add('active');
    document.getElementById('viewManage').classList.add('active');
  }
}

// LÓGICA DO CALENDÁRIO
function changeMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const monthTitleEl = document.getElementById('calendarMonthTitle');
  if (monthTitleEl) {
    monthTitleEl.innerText = `${monthNames[month]} ${year}`;
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayStr = getTodayString();
  const gridEl = document.getElementById('calendarGrid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'calendar-day empty';
    gridEl.appendChild(emptyDiv);
  }

  let completedCountThisMonth = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.innerText = day;

    const isToday = dayStr === todayStr;
    const isCompleted = state.completedDays.includes(dayStr);

    if (isCompleted) {
      completedCountThisMonth++;
      dayDiv.classList.add('completed');
    }

    if (isToday) {
      dayDiv.classList.add('today');
    }

    gridEl.appendChild(dayDiv);
  }

  const monthCountEl = document.getElementById('monthCompletedCount');
  if (monthCountEl) monthCountEl.innerText = completedCountThisMonth;

  const rateEl = document.getElementById('monthSuccessRate');
  if (rateEl) {
    const today = new Date();
    let totalElapsedDays = daysInMonth;
    if (year === today.getFullYear() && month === today.getMonth()) {
      totalElapsedDays = today.getDate();
    }
    const rate = totalElapsedDays > 0 ? Math.round((completedCountThisMonth / totalElapsedDays) * 100) : 0;
    rateEl.innerText = `${rate}%`;
  }
}

// AÇÕES: ABA HOJE
function toggleTodayTask(id) {
  const task = state.todayTasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    updateStreakLogic();
  }
}

function addTodayTask() {
  const input = document.getElementById('newTodayInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text,
    done: false,
    isOneOff: true
  };
  
  state.todayTasks.push(newTask);
  input.value = '';
  updateStreakLogic();
}

function deleteTodayTask(id, event) {
  if (event) event.stopPropagation();
  state.todayTasks = state.todayTasks.filter(t => t.id !== id);
  updateStreakLogic();
}

// AÇÕES: ABA GERENCIAR ATIVIDADES - ATIVAR / DESATIVAR SUGESTÃO PADRÃO
function toggleDefaultTaskByIndex(index, enable) {
  const text = defaultSuggestions[index];
  if (!text) return;

  const existingMaster = state.masterTasks.find(t => t.text.trim().toLowerCase() === text.trim().toLowerCase());

  if (enable) {
    if (!existingMaster) {
      const newTask = {
        id: Date.now(),
        text: text
      };
      state.masterTasks.push(newTask);
      if (!state.todayTasks.some(t => t.text.trim().toLowerCase() === text.trim().toLowerCase())) {
        state.todayTasks.push({
          id: newTask.id,
          text: newTask.text,
          done: false
        });
      }
    }
  } else {
    if (existingMaster) {
      state.masterTasks = state.masterTasks.filter(t => t.id !== existingMaster.id);
      state.todayTasks = state.todayTasks.filter(t => t.id !== existingMaster.id);
    }
  }

  updateStreakLogic();
}

// AÇÕES: ABA GERENCIAR ATIVIDADES - ADICIONAR PERSONALIZADA
function addMasterTask() {
  const input = document.getElementById('newMasterInput');
  const text = input.value.trim();
  if (!text) return;

  const newTask = {
    id: Date.now(),
    text: text
  };
  state.masterTasks.push(newTask);
  state.todayTasks.push({
    id: newTask.id,
    text: newTask.text,
    done: false
  });

  input.value = '';
  updateStreakLogic();
}

function deleteMasterTask(id) {
  state.masterTasks = state.masterTasks.filter(t => t.id !== id);
  state.todayTasks = state.todayTasks.filter(t => t.id !== id);
  updateStreakLogic();
}

// RENDERIZAÇÃO DA INTERFACE
function render() {
  // 1. Ofensiva
  document.getElementById('streakCount').innerText = `🔥 ${state.streak}`;
  const streakStatusEl = document.getElementById('streakStatus');

  const hasTasks = state.todayTasks.length > 0;
  const allDone = hasTasks && state.todayTasks.every(t => t.done);

  if (!hasTasks) {
    streakStatusEl.innerText = "Cadastre ou ative atividades na aba ao lado!";
    streakStatusEl.className = "streak-status";
  } else if (allDone) {
    streakStatusEl.innerText = "🎉 Todas as metas de hoje concluídas!";
    streakStatusEl.className = "streak-status complete";
  } else {
    const remaining = state.todayTasks.filter(t => !t.done).length;
    streakStatusEl.innerText = `Falta(m) ${remaining} meta(s) para garantir o dia.`;
    streakStatusEl.className = "streak-status";
  }

  // 1.5 Card de Meta de 5 Dias e Barra de Progresso
  const completedCycles = Math.floor(state.streak / 5);
  const goalCyclesEl = document.getElementById('goalCyclesBadge');
  if (goalCyclesEl) goalCyclesEl.innerText = `Ciclos: ${completedCycles}`;

  let displayProgress = state.streak % 5;
  if (state.streak > 0 && state.streak % 5 === 0) {
    displayProgress = 5;
  }

  const goalCountEl = document.getElementById('goalCount');
  if (goalCountEl) goalCountEl.innerText = `${displayProgress} / 5 dias`;

  const fillPercentage = (displayProgress / 5) * 100;
  const goalFillEl = document.getElementById('goalProgressFill');
  if (goalFillEl) goalFillEl.style.width = `${fillPercentage}%`;

  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById(`step${i}`);
    if (stepEl) {
      if (i <= displayProgress) {
        stepEl.className = i === 5 && displayProgress === 5 ? 'step-dot completed' : 'step-dot active';
      } else {
        stepEl.className = 'step-dot';
      }
    }
  }

  // 2. Lista de Hoje
  const pendingListEl = document.getElementById('pendingTaskList');
  const completedListEl = document.getElementById('completedTaskList');
  if (pendingListEl) pendingListEl.innerHTML = '';
  if (completedListEl) completedListEl.innerHTML = '';

  // Monitor de Hoje
  const todayMonitorEl = document.getElementById('todayMonitor');
  if (todayMonitorEl) {
    const totalTasks = state.todayTasks.length;
    const completedTasks = state.todayTasks.filter(t => t.done).length;
    todayMonitorEl.innerText = `${completedTasks}/${totalTasks} concluídas`;
    
    if (totalTasks === 0) {
      todayMonitorEl.style.display = 'none';
    } else {
      todayMonitorEl.style.display = 'inline-block';
      if (completedTasks === totalTasks) {
        todayMonitorEl.className = 'today-monitor complete';
      } else {
        todayMonitorEl.className = 'today-monitor';
      }
    }
  }

  if (state.todayTasks.length === 0) {
    if (pendingListEl) pendingListEl.innerHTML = `<div class="empty-state">Nenhuma atividade ativa para hoje.<br>Vá na aba "Gerenciar" para ativar!</div>`;
  } else {
    state.todayTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.done ? 'done' : ''}`;
      
      const badge = task.isOneOff ? `<span class="badge-one-off">Pontual</span>` : '';
      
      li.innerHTML = `
        <div class="checkbox-container" onclick="toggleTodayTask(${task.id})">
          <div class="custom-checkbox"></div>
          <span class="task-text">${escapeHtml(task.text)} ${badge}</span>
        </div>
        <button class="btn-delete" onclick="deleteTodayTask(${task.id}, event)" title="Remover de hoje">&times;</button>
      `;
      if (task.done) {
        if (completedListEl) completedListEl.appendChild(li);
      } else {
        if (pendingListEl) pendingListEl.appendChild(li);
      }
    });
    
    if (completedListEl && completedListEl.children.length === 0) {
      completedListEl.innerHTML = `<div class="empty-state" style="padding: 10px 20px;">Nenhuma atividade concluída ainda.</div>`;
    }
    if (pendingListEl && pendingListEl.children.length === 0) {
      pendingListEl.innerHTML = `<div class="empty-state" style="padding: 10px 20px;">🎉 Todas pendentes concluídas!</div>`;
    }
  }

  // 3. Renderizar Lista de Atividades Sugeridas com Interruptor (Toggle Switch)
  const defaultListEl = document.getElementById('defaultTaskList');
  if (defaultListEl) {
    defaultListEl.innerHTML = '';

    defaultSuggestions.forEach((sug, index) => {
      const isActive = state.masterTasks.some(t => t.text.trim().toLowerCase() === sug.trim().toLowerCase());
      const li = document.createElement('li');
      li.className = `task-item ${isActive ? '' : 'inactive'}`;
      
      li.innerHTML = `
        <span class="task-text">${escapeHtml(sug)}</span>
        <label class="switch">
          <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleDefaultTaskByIndex(${index}, this.checked)">
          <span class="slider"></span>
        </label>
      `;
      defaultListEl.appendChild(li);
    });
  }

  // 4. Renderizar Lista de Atividades Personalizadas (Custom)
  const masterListEl = document.getElementById('masterTaskList');
  if (masterListEl) {
    masterListEl.innerHTML = '';

    const customTasks = state.masterTasks.filter(task => 
      !defaultSuggestions.some(sug => sug.trim().toLowerCase() === task.text.trim().toLowerCase())
    );

    if (customTasks.length === 0) {
      masterListEl.innerHTML = `<div class="empty-state">Nenhuma atividade personalizada criada ainda.</div>`;
    } else {
      customTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
          <span class="task-text">${escapeHtml(task.text)}</span>
          <button class="btn-delete" onclick="deleteMasterTask(${task.id})" title="Excluir">&times;</button>
        `;
        masterListEl.appendChild(li);
      });
    }
  }

  // 4.5 Renderizar Lista de Atividades Pontuais (Só Hoje) na aba Gerenciar
  const oneOffListEl = document.getElementById('oneOffTaskList');
  if (oneOffListEl) {
    oneOffListEl.innerHTML = '';

    const oneOffTasks = state.todayTasks.filter(task => task.isOneOff);

    if (oneOffTasks.length === 0) {
      oneOffListEl.innerHTML = `<div class="empty-state">Nenhuma atividade pontual adicionada hoje.</div>`;
    } else {
      oneOffTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
          <span class="task-text">${escapeHtml(task.text)} <span class="badge-one-off">Pontual</span></span>
          <button class="btn-delete" onclick="deleteTodayTask(${task.id}, event)" title="Excluir">&times;</button>
        `;
        oneOffListEl.appendChild(li);
      });
    }
  }

  // 5. Atualizar Calendário
  renderCalendar();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  initDayCheck();
  render();
});
