// ==================== Sticky Notes ====================
const createNote = (x, y) => {
    const notes = Storage.load('canvasNotes') || [];
    const note = {
        id: Date.now().toString(),
        x: x,
        y: y,
        content: '',
        color: AppState.currentColor,
        width: 150,
        height: 100
    };
    notes.push(note);
    Storage.save('canvasNotes', notes);
    renderNotes();
};

const renderNotes = () => {
    const notes = Storage.load('canvasNotes') || [];
    elements.notesContainer.innerHTML = '';

    notes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'sticky-note';
        el.id = `note-${note.id}`;
        el.style.cssText = `
            left: ${note.x}px;
            top: ${note.y}px;
            background: ${note.color}20;
            border-left: 4px solid ${note.color};
        `;
        el.innerHTML = `
            <textarea class="sticky-note-content" style="color: ${note.color};">${note.content}</textarea>
            <button class="sticky-note-delete" aria-label="删除">×</button>
        `;

        const textarea = el.querySelector('textarea');
        textarea.addEventListener('input', () => {
            const notes = Storage.load('canvasNotes') || [];
            const idx = notes.findIndex(n => n.id === note.id);
            if (idx >= 0) {
                notes[idx].content = textarea.value;
                Storage.save('canvasNotes', notes);
            }
        });

        const deleteBtn = el.querySelector('.sticky-note-delete');
        deleteBtn.addEventListener('click', () => {
            const notes = Storage.load('canvasNotes') || [];
            const idx = notes.findIndex(n => n.id === note.id);
            if (idx >= 0) {
                notes.splice(idx, 1);
                Storage.save('canvasNotes', notes);
                el.remove();
                showToast('便签已删除');
            }
        });

        // Drag functionality
        let isDragging = false;
        let startX, startY;

        el.addEventListener('touchstart', (e) => {
            if (e.target === textarea) return;
            isDragging = true;
            startX = e.touches[0].clientX - note.x;
            startY = e.touches[0].clientY - note.y;
        });

        el.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            note.x = e.touches[0].clientX - startX;
            note.y = e.touches[0].clientY - startY;
            el.style.left = `${note.x}px`;
            el.style.top = `${note.y}px`;
        });

        el.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                const notes = Storage.load('canvasNotes') || [];
                const idx = notes.findIndex(n => n.id === note.id);
                if (idx >= 0) {
                    notes[idx].x = note.x;
                    notes[idx].y = note.y;
                    Storage.save('canvasNotes', notes);
                }
            }
        });

        elements.notesContainer.appendChild(el);
    });
};

canvas.addEventListener('dblclick', (e) => {
    if (AppState.currentTool === 'note') {
        const pos = getTouchPos(e);
        createNote(pos.x - 75, pos.y - 50);
    }
});

// Click to create note
elements.noteTool.addEventListener('click', () => {
    showToast('双击画布创建便签');
});
