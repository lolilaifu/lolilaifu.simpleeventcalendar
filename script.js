document.addEventListener('DOMContentLoaded', () => {
  const calendarGrid = document.getElementById('calendar-grid');
  const currentMonthElement = document.getElementById('current-month');
  const prevMonthButton = document.getElementById('prev-month');
  const nextMonthButton = document.getElementById('next-month');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Modals
  const dayEventsModal = document.getElementById('day-events-modal');
  const eventDetailsModal = document.getElementById('event-details-modal');
  const eventEditModal = document.getElementById('event-edit-modal');
  const newEventModal = document.getElementById('new-event-modal');
  const categoryModal = document.getElementById('category-modal');
  
  // Event Elements
  const dayEventsList = document.getElementById('day-events-list');
  const eventDetailsTitle = document.getElementById('event-details-title');
  const eventDetailsDate = document.getElementById('event-details-date');
  const eventDetailsDescription = document.getElementById('event-details-description');
  
  // Forms
  const eventEditForm = document.getElementById('event-edit-form');
  const newEventForm = document.getElementById('new-event-form');
  const categoryForm = document.getElementById('category-form');
  
  let currentDate = new Date();
  let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
  let categories = JSON.parse(localStorage.getItem('calendarCategories')) || {
    work: 'var(--category-work)',
    personal: 'var(--category-personal)',
    meeting: 'var(--category-meeting)',
    birthday: 'var(--category-birthday)'
  };
  let currentDay = null;
  let currentEvent = null;

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
    const startDay = firstDay.getDay();

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
    if (e.target === dayEventsModal || 
        e.target === eventDetailsModal || 
        e.target === eventEditModal || 
        e.target === newEventModal || 
        e.target === categoryModal) {
      dayEventsModal.style.display = 'none';
      eventDetailsModal.style.display = 'none';
      eventEditModal.style.display = 'none';
      newEventModal.style.display = 'none';
      categoryModal.style.display = 'none';
    }
  });

  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      dayEventsModal.style.display = 'none';
      eventDetailsModal.style.display = 'none';
      eventEditModal.style.display = 'none';
      newEventModal.style.display = 'none';
      categoryModal.style.display = 'none';
    });
  });

  // Initialize
  const savedTheme = localStorage.getItem('calendarTheme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  renderCalendar(currentDate);

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