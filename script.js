// Configuração dos dados no LocalStorage
let state = JSON.parse(localStorage.getItem('app_foco_state')) || {
  streak: 0,
  lastDate: null,          // Última data em que abriu o app ('YYYY-MM-DD')
  completedTodayDate: null, // Data em que ganhou +1 na ofensiva ('YYYY-MM-DD')
  masterTasks: [],         // Lista fixa de atividades diárias
  todayTasks: []           // [{ id, text, done }] do dia atual
};

// Sugestões padrão personalizadas
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
      // Se não concluiu tudo no dia anterior, zera a ofensiva!
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
    }
  } else {
    // Se NÃO concluiu todas, mas já tinha pontuado hoje (ex: adicionou nova tarefa)
    if (state.completedTodayDate === today) {
      state.streak = Math.max(0, state.streak - 1);
      state.completedTodayDate = null; // Libera para pontuar novamente assim que terminar a nova
    }
  }

  saveState();
  render();
}

// Alternar entre abas
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

  if (tabName === 'today') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('viewToday').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('viewManage').classList.add('active');
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

// AÇÕES: ABA GERENCIAR ATIVIDADES
function addSpecificMasterTask(text) {
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
  updateStreakLogic();
}

function addMasterTask() {
  const input = document.getElementById('newMasterInput');
  const text = input.value.trim();
  if (!text) return;

  addSpecificMasterTask(text);
  input.value = '';
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
    streakStatusEl.innerText = "Cadastre atividades na aba ao lado!";
    streakStatusEl.className = "streak-status";
  } else if (allDone) {
    streakStatusEl.innerText = "🎉 Todas as metas de hoje concluídas!";
    streakStatusEl.className = "streak-status complete";
  } else {
    const remaining = state.todayTasks.filter(t => !t.done).length;
    streakStatusEl.innerText = `Falta(m) ${remaining} meta(s) para garantir o dia.`;
    streakStatusEl.className = "streak-status";
  }

  // 2. Lista de Hoje
  const todayListEl = document.getElementById('todayTaskList');
  todayListEl.innerHTML = '';

  if (state.todayTasks.length === 0) {
    todayListEl.innerHTML = `<div class="empty-state">Nenhuma atividade registrada para hoje.<br>Vá na aba "Gerenciar Atividades" para cadastrar!</div>`;
  } else {
    state.todayTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.done ? 'done' : ''}`;
      li.innerHTML = `
        <div class="checkbox-container" onclick="toggleTodayTask(${task.id})">
          <div class="custom-checkbox"></div>
          <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
      `;
      todayListEl.appendChild(li);
    });
  }

  // 3. Lista de Gerenciamento
  const masterListEl = document.getElementById('masterTaskList');
  masterListEl.innerHTML = '';

  if (state.masterTasks.length === 0) {
    masterListEl.innerHTML = `<div class="empty-state">Sua lista diária está vazia. Adicione uma atividade acima!</div>`;
  } else {
    state.masterTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = `
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="btn-delete" onclick="deleteMasterTask(${task.id})">&times;</button>
      `;
      masterListEl.appendChild(li);
    });
  }

  // 4. Renderizar Sugestões
  const suggestionsContainer = document.getElementById('suggestionsList');
  suggestionsContainer.innerHTML = '';
  
  const availableSuggestions = defaultSuggestions.filter(sug => 
    !state.masterTasks.some(task => task.text.trim().toLowerCase() === sug.trim().toLowerCase())
  );

  if (availableSuggestions.length === 0) {
    suggestionsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem; padding: 8px 0;">Todas as sugestões já foram adicionadas!</span>';
  } else {
    availableSuggestions.forEach(sug => {
      const btn = document.createElement('button');
      btn.className = 'suggestion-btn';
      btn.innerText = `+ ${sug}`;
      btn.onclick = () => addSpecificMasterTask(sug);
      suggestionsContainer.appendChild(btn);
    });
  }
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
