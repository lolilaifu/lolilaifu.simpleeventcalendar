document.addEventListener('DOMContentLoaded', () => {
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthElement = document.getElementById('current-month');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const settingsButton = document.getElementById('settings-button');
  
  // Modals
  const settingsModal = document.getElementById('settings-modal');
  const dayEventsModal = document.getElementById('day-events-modal');
  const eventDetailsModal = document.getElementById('event-details-modal');
  const eventEditModal = document.getElementById('event-edit-modal');
  const newEventModal = document.getElementById('new-event-modal');
  const categoryModal = document.getElementById('category-modal');
  
  // Settings Elements
  const downloadDataButton = document.getElementById('download-data');
  const uploadDataButton = document.getElementById('upload-data');
  
  // Event Elements
  const dayEventsList = document.getElementById('day-events-list');
  const eventDetailsTitle = document.getElementById('event-details-title');
  const eventDetailsDate = document.getElementById('event-details-date');
  const eventDetailsDescription = document.getElementById('event-details-description');
  
  // Forms
  const eventEditForm = document.getElementById('event-edit-form');
  const newEventForm = document.getElementById('new-event-form');
  const categoryForm = document.getElementById('category-form');
  
  // Edit Form Elements
  const editEventTitle = document.getElementById('edit-event-title');
  const editEventDate = document.getElementById('edit-event-date');
  const editEventCategory = document.getElementById('edit-event-category');
  const editEventDescription = document.getElementById('edit-event-description');
  
  let currentDate = new Date();
  let weekStart = localStorage.getItem('calendarWeekStart') || '0'; // 0=Sunday, 1=Monday
  let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
  let categories = JSON.parse(localStorage.getItem('calendarCategories')) || {
    work: 'var(--category-work)',
    personal: 'var(--category-personal)',
    meeting: 'var(--category-meeting)',
    birthday: 'var(--category-birthday)'
  };
  let currentDay = null;
  let currentEvent = null;

  // Settings functionality
  const weekStartSelect = document.getElementById('week-start-select');
  weekStartSelect.value = weekStart;
  
  function updateDayHeaders() {
    const dayHeaders = document.querySelectorAll('.calendar-days > div');
    if (weekStart === '1') { // Monday
      dayHeaders[0].textContent = 'Mon';
      dayHeaders[1].textContent = 'Tue';
      dayHeaders[2].textContent = 'Wed';
      dayHeaders[3].textContent = 'Thu';
      dayHeaders[4].textContent = 'Fri';
      dayHeaders[5].textContent = 'Sat';
      dayHeaders[6].textContent = 'Sun';
    } else { // Sunday
      dayHeaders[0].textContent = 'Sun';
      dayHeaders[1].textContent = 'Mon';
      dayHeaders[2].textContent = 'Tue';
      dayHeaders[3].textContent = 'Wed';
      dayHeaders[4].textContent = 'Thu';
      dayHeaders[5].textContent = 'Fri';
      dayHeaders[6].textContent = 'Sat';
    }
  }

  weekStartSelect.addEventListener('change', () => {
    weekStart = weekStartSelect.value;
    localStorage.setItem('calendarWeekStart', weekStart);
    updateDayHeaders();
    renderCalendar(currentDate);
  });

  settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'block';
  });

  downloadDataButton.addEventListener('click', () => {
    const data = {
      events: JSON.parse(localStorage.getItem('calendarEvents')) || {},
      categories: JSON.parse(localStorage.getItem('calendarCategories')) || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  uploadDataButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.events || !data.categories) {
            throw new Error('Invalid backup file');
          }
          
          localStorage.setItem('calendarEvents', JSON.stringify(data.events));
          localStorage.setItem('calendarCategories', JSON.stringify(data.categories));
          events = data.events;
          categories = data.categories;
          renderCalendar(currentDate);
          alert('Data restored successfully!');
        } catch (error) {
          alert('Error restoring data: ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  });

  // Rest of the existing code remains unchanged...
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const updateCategorySelect = (selectElement) => {
    selectElement.innerHTML = '';
    
    // Add default categories
    ['work', 'personal', 'meeting', 'birthday'].forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      selectElement.appendChild(option);
    });

    // Add custom categories
    Object.keys(categories).forEach(cat => {
      if (!['work', 'personal', 'meeting', 'birthday'].includes(cat)) {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectElement.appendChild(option);
      }
    });
  };

  const renderCalendar = (date) => {
    calendarGrid.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();

    currentMonthElement.textContent = 
      `${date.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay();
    
    // Adjust start day based on week start preference
    if (weekStart === '1') { // Monday
      startDay = startDay === 0 ? 6 : startDay - 1;
    }

    for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.classList.add('calendar-day', 'empty');
      calendarGrid.appendChild(emptyDay);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      dayElement.textContent = day;

      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (events[dateKey]) {
        const eventCount = document.createElement('span');
        eventCount.classList.add('event-count');
        eventCount.textContent = ` (${events[dateKey].length})`;
        dayElement.appendChild(eventCount);

        events[dateKey].forEach((event, index) => {
          const indicator = document.createElement('div');
          indicator.classList.add('event-indicator');
          indicator.style.backgroundColor = categories[event.category] || '#ccc';
          indicator.addEventListener('click', (e) => {
            e.stopPropagation();
            showEventDetails(dateKey, index);
          });
          dayElement.appendChild(indicator);
        });
      }

      if (day === currentDate.getDate() && 
          month === currentDate.getMonth() && 
          year === currentDate.getFullYear()) {
        dayElement.classList.add('current-day');
      }

      dayElement.addEventListener('click', () => showDayEvents(dateKey));
      calendarGrid.appendChild(dayElement);
    }
  };

  // Rest of the existing event handling and modal code remains unchanged...
  const showDayEvents = (date) => {
    currentDay = date;
    dayEventsList.innerHTML = '';
    
    if (events[date]) {
      events[date].forEach((event, index) => {
        const eventItem = document.createElement('div');
        eventItem.classList.add('day-event-item');
        eventItem.style.backgroundColor = categories[event.category] || '#ccc';
        eventItem.style.color = 'white';
        eventItem.innerHTML = `
          <strong>${event.title}</strong>
          <p>${event.description}</p>
        `;
        eventItem.addEventListener('click', (e) => {
          e.stopPropagation();
          showEventDetails(date, index);
        });
        dayEventsList.appendChild(eventItem);
      });
    }
    
    dayEventsModal.style.display = 'block';
  };

  const showEventDetails = (date, index) => {
    currentEvent = { date, index };
    const event = events[date][index];
    eventDetailsTitle.textContent = event.title;
    eventDetailsDate.textContent = `Date: ${event.date}`;
    eventDetailsDescription.textContent = event.description;
    eventDetailsModal.style.display = 'block';
  };

  const deleteCurrentEvent = () => {
    if (currentEvent && confirm('Are you sure you want to delete this event?')) {
      const { date, index } = currentEvent;
      events[date].splice(index, 1);
      if (events[date].length === 0) {
        delete events[date];
      }
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      renderCalendar(currentDate);
      eventDetailsModal.style.display = 'none';
      showDayEvents(date);
    }
  };

  const editCurrentEvent = () => {
    if (!currentEvent) return;
    const { date, index } = currentEvent;
    const event = events[date][index];
    
    editEventTitle.value = event.title;
    editEventDate.value = event.date;
    editEventDescription.value = event.description;
    updateCategorySelect(document.getElementById('edit-event-category'));
    editEventCategory.value = event.category;
    
    eventDetailsModal.style.display = 'none';
    eventEditModal.style.display = 'block';
  };

  const saveEditedEvent = (e) => {
    e.preventDefault();
    if (!currentEvent) return;
    
    const { date, index } = currentEvent;
    events[date][index] = {
      title: editEventTitle.value,
      date: editEventDate.value,
      category: editEventCategory.value,
      description: editEventDescription.value
    };
    
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar(currentDate);
    eventEditModal.style.display = 'none';
    showDayEvents(date);
  };

  const createNewEvent = (e) => {
    e.preventDefault();
    if (!currentDay) return;
    
    const event = {
      title: document.getElementById('new-event-title').value,
      date: document.getElementById('new-event-date').value,
      category: document.getElementById('new-event-category').value,
      description: document.getElementById('new-event-description').value
    };
    
    if (!events[currentDay]) {
      events[currentDay] = [];
    }
    events[currentDay].push(event);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    renderCalendar(currentDate);
    newEventModal.style.display = 'none';
    showDayEvents(currentDay);
  };

  // Event Listeners
  document.getElementById('delete-event').addEventListener('click', deleteCurrentEvent);
  document.getElementById('edit-event').addEventListener('click', editCurrentEvent);
  document.getElementById('add-new-event').addEventListener('click', () => {
    document.getElementById('new-event-date').value = currentDay;
    updateCategorySelect(document.getElementById('new-event-category'));
    newEventModal.style.display = 'block';
  });
  eventEditForm.addEventListener('submit', saveEditedEvent);
  newEventForm.addEventListener('submit', createNewEvent);
  document.getElementById('cancel-edit').addEventListener('click', () => {
    eventEditModal.style.display = 'none';
  });
  document.getElementById('cancel-new-event').addEventListener('click', () => {
    newEventModal.style.display = 'none';
  });

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal || 
        e.target === dayEventsModal || 
        e.target === eventDetailsModal || 
        e.target === eventEditModal || 
        e.target === newEventModal || 
        e.target === categoryModal ||
        e.target === notesModal) {
      // Don't close settings modal if clicking dark mode toggle
      if (e.target === settingsModal && e.target.closest('#dark-mode-toggle')) {
        return;
      }
      settingsModal.style.display = 'none';
      dayEventsModal.style.display = 'none';
      eventDetailsModal.style.display = 'none';
      eventEditModal.style.display = 'none';
      newEventModal.style.display = 'none';
      categoryModal.style.display = 'none';
      notesModal.style.display = 'none';
    }
  });

  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      settingsModal.style.display = 'none';
      dayEventsModal.style.display = 'none';
      eventDetailsModal.style.display = 'none';
      eventEditModal.style.display = 'none';
      newEventModal.style.display = 'none';
      categoryModal.style.display = 'none';
      notesModal.style.display = 'none';
    });
  });

  // Initialize
  const savedTheme = localStorage.getItem('calendarTheme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  renderCalendar(currentDate);
  
  // Update day headers on initialization
  updateDayHeaders();

  // Notes functionality
  const notesButton = document.getElementById('notes-button');
  const notesModal = document.getElementById('notes-modal');
  const notesList = document.getElementById('notes-list');
  const noteEditModal = document.getElementById('note-edit-modal');
  const noteEditForm = document.getElementById('note-edit-form');
  const addNewNoteButton = document.getElementById('add-new-note');
  
  // Add rich text formatting functionality
  document.querySelectorAll('.format-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const command = button.dataset.command;
      document.execCommand(command, false, null);
      
      // Update button active state
      document.querySelectorAll('.format-btn').forEach(btn => btn.classList.remove('active'));
      if (document.queryCommandState(command)) {
        button.classList.add('active');
      }
    });
  });
  
  let notes = JSON.parse(localStorage.getItem('calendarNotes')) || [];
  let currentNote = null;
  let currentPage = 0;
  const notesPerPage = 3;

  // Load notes when modal opens
  notesButton.addEventListener('click', () => {
    renderNotesList();
    notesModal.style.display = 'block';
  });

  // Add new note button
  addNewNoteButton.addEventListener('click', () => {
    currentNote = null;
    noteEditForm.reset();
    noteEditModal.style.display = 'block';
  });

  // Save note handler
  noteEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const note = {
      title: document.getElementById('note-title').value,
      content: document.getElementById('note-content').value,
      timestamp: new Date().toISOString()
    };

    if (currentNote !== null) {
      // Update existing note
      notes[currentNote] = note;
    } else {
      // Add new note
      notes.push(note);
    }

    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    renderNotesList();
    noteEditModal.style.display = 'none';
  });

  // Render notes list
  function renderNotesList() {
    notesList.innerHTML = '';
    
    // Calculate pagination
    const startIndex = currentPage * notesPerPage;
    const endIndex = startIndex + notesPerPage;
    const paginatedNotes = notes.slice(startIndex, endIndex);
    
    // Add pagination controls
    const paginationControls = document.createElement('div');
    paginationControls.classList.add('pagination-controls');
    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.disabled = currentPage === 0;
    prevButton.addEventListener('click', () => {
      currentPage--;
      renderNotesList();
    });
    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = endIndex >= notes.length;
    nextButton.addEventListener('click', () => {
      currentPage++;
      renderNotesList();
    });
    
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Page ${currentPage + 1} of ${Math.ceil(notes.length / notesPerPage)}`;
    
    paginationControls.appendChild(prevButton);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(nextButton);
    notesList.appendChild(paginationControls);
    
    // Render notes
    paginatedNotes.forEach((note, index) => {
      const actualIndex = startIndex + index;
      const noteElement = document.createElement('div');
      noteElement.classList.add('note-item');
      noteElement.innerHTML = `
        <div class="note-title">${note.title}</div>
        <div class="note-content">${note.content}</div>
      `;
      
      noteElement.addEventListener('click', () => {
        currentNote = actualIndex;
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        noteEditModal.style.display = 'block';
      });

      // Add delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('delete-note');
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this note?')) {
          notes.splice(index, 1);
          localStorage.setItem('calendarNotes', JSON.stringify(notes));
          renderNotesList();
        }
      });

      noteElement.appendChild(deleteButton);
      notesList.appendChild(noteElement);
    });
  }

  // Cancel note edit
  document.getElementById('cancel-note-edit').addEventListener('click', () => {
    noteEditModal.style.display = 'none';
  });

  // Exit notes button
  document.getElementById('exit-notes').addEventListener('click', () => {
    notesModal.style.display = 'none';
  });

  // Navigation
  prevMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  nextMonthButton.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  darkModeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('calendarTheme', isDark ? 'light' : 'dark');
  });
});
