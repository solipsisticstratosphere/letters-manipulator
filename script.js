document.addEventListener("DOMContentLoaded", () => {
  const textInput = document.getElementById("textInput");
  const applyButton = document.getElementById("applyButton");
  const resultContainer = document.getElementById("result");
  let letters = [];
  let selectedLetters = new Set();
  let isDragging = false;
  let selectionBox = null;
  let startX, startY;
  let draggedLetter = null;
  let draggedLetters = new Set();
  let dragStartIndex = -1;
  let groupOffsets = new Map(); // Хранит относительные позиции букв в группе

  // Create and apply text
  applyButton.addEventListener("click", () => {
    const text = textInput.value;
    resultContainer.innerHTML = "";
    letters = [];
    selectedLetters.clear();
    groupOffsets.clear();

    text.split("").forEach((char, index) => {
      const letter = document.createElement("span");
      letter.className = "letter";
      letter.textContent = char;
      letter.dataset.index = index;
      resultContainer.appendChild(letter);
      letters.push(letter);
    });
  });

  // Handle letter selection with Ctrl key
  resultContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("letter")) {
      if (e.ctrlKey) {
        e.target.classList.toggle("selected");
        if (e.target.classList.contains("selected")) {
          selectedLetters.add(e.target);
        } else {
          selectedLetters.delete(e.target);
        }
      }
    }
  });

  // Handle drag and drop
  resultContainer.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("letter")) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      // Если кликнули на выделенную букву и есть другие выделенные буквы
      if (e.target.classList.contains("selected") && selectedLetters.size > 1) {
        draggedLetters = new Set(selectedLetters);
        dragStartIndex = parseInt(e.target.dataset.index);

        // Сохраняем относительные позиции букв в группе
        const baseIndex = dragStartIndex;
        draggedLetters.forEach((letter) => {
          const letterIndex = parseInt(letter.dataset.index);
          groupOffsets.set(letter, letterIndex - baseIndex);
          letter.classList.add("dragging");
        });
      } else {
        // Если кликнули на невыделенную букву или единственную выделенную
        selectedLetters.forEach((letter) => {
          letter.classList.remove("selected");
        });
        selectedLetters.clear();
        groupOffsets.clear();

        draggedLetter = e.target;
        draggedLetter.classList.add("selected");
        selectedLetters.add(draggedLetter);
        draggedLetter.classList.add("dragging");
        dragStartIndex = parseInt(draggedLetter.dataset.index);
      }
    } else {
      // Start selection box
      startX = e.clientX;
      startY = e.clientY;
      selectionBox = document.createElement("div");
      selectionBox.className = "selection-box";
      document.body.appendChild(selectionBox);

      selectedLetters.forEach((letter) => {
        letter.classList.remove("selected");
      });
      selectedLetters.clear();
      groupOffsets.clear();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const targetElement = document.elementFromPoint(e.clientX, e.clientY);

      if (targetElement && targetElement.classList.contains("letter")) {
        const targetIndex = parseInt(targetElement.dataset.index);

        // Проверяем, что индекс в пределах массива
        if (targetIndex < 0 || targetIndex >= letters.length) return;

        if (draggedLetter) {
          // Перемещение одной буквы
          if (targetIndex !== dragStartIndex) {
            // Перемещаем все буквы между начальной и текущей позицией
            const start = Math.min(dragStartIndex, targetIndex);
            const end = Math.max(dragStartIndex, targetIndex);
            const direction = targetIndex > dragStartIndex ? 1 : -1;

            for (let i = start; i <= end; i++) {
              if (i < 0 || i >= letters.length) continue;
              const currentLetter = letters[i];
              if (currentLetter !== draggedLetter) {
                currentLetter.dataset.index = (
                  parseInt(currentLetter.dataset.index) - direction
                ).toString();
              }
            }

            draggedLetter.dataset.index = targetIndex.toString();
            dragStartIndex = targetIndex;

            // Пересортировываем буквы в контейнере
            letters.sort(
              (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
            );
            letters.forEach((letter) => resultContainer.appendChild(letter));
          }
        } else if (draggedLetters.size > 0) {
          // Перемещение группы букв
          if (targetIndex !== dragStartIndex) {
            // Проверяем, не выходим ли мы за пределы массива
            const maxOffset = Math.max(
              ...Array.from(draggedLetters).map((letter) =>
                groupOffsets.get(letter)
              )
            );
            const minOffset = Math.min(
              ...Array.from(draggedLetters).map((letter) =>
                groupOffsets.get(letter)
              )
            );

            // Проверяем, что все буквы группы поместятся в пределах массива
            if (
              targetIndex + maxOffset >= letters.length ||
              targetIndex + minOffset < 0
            )
              return;

            // Создаем временный массив для хранения новых позиций
            const newPositions = new Map();

            // Вычисляем новые позиции для всех букв
            letters.forEach((letter) => {
              if (!draggedLetters.has(letter)) {
                const letterIndex = parseInt(letter.dataset.index);
                let newIndex = letterIndex;

                if (targetIndex > dragStartIndex) {
                  // Перемещение вправо
                  if (
                    letterIndex > dragStartIndex &&
                    letterIndex <= targetIndex
                  ) {
                    newIndex = letterIndex - draggedLetters.size;
                  }
                } else {
                  // Перемещение влево
                  if (
                    letterIndex >= targetIndex &&
                    letterIndex < dragStartIndex
                  ) {
                    newIndex = letterIndex + draggedLetters.size;
                  }
                }

                newPositions.set(letter, newIndex);
              }
            });

            newPositions.forEach((newIndex, letter) => {
              letter.dataset.index = newIndex.toString();
            });

            draggedLetters.forEach((letter) => {
              const offset = groupOffsets.get(letter);
              letter.dataset.index = (targetIndex + offset).toString();
            });

            dragStartIndex = targetIndex;

            letters.sort(
              (a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index)
            );
            letters.forEach((letter) => resultContainer.appendChild(letter));
          }
        }
      }
    } else if (selectionBox) {
      const currentX = e.clientX;
      const currentY = e.clientY;
      const containerRect = resultContainer.getBoundingClientRect();

      const left = Math.max(containerRect.left, Math.min(startX, currentX));
      const top = Math.max(containerRect.top, Math.min(startY, currentY));
      const width = Math.min(
        Math.abs(currentX - startX),
        containerRect.right - left
      );
      const height = Math.min(
        Math.abs(currentY - startY),
        containerRect.bottom - top
      );

      selectionBox.style.left = `${left}px`;
      selectionBox.style.top = `${top}px`;
      selectionBox.style.width = `${width}px`;
      selectionBox.style.height = `${height}px`;

      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect();
        if (
          rect.left < left + width &&
          rect.right > left &&
          rect.top < top + height &&
          rect.bottom > top
        ) {
          letter.classList.add("selected");
          selectedLetters.add(letter);
        } else {
          letter.classList.remove("selected");
          selectedLetters.delete(letter);
        }
      });
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (isDragging) {
      isDragging = false;

      if (draggedLetter) {
        draggedLetter.classList.remove("dragging");
        draggedLetter = null;
      } else if (draggedLetters.size > 0) {
        draggedLetters.forEach((letter) => {
          letter.classList.remove("dragging");
        });
        draggedLetters.clear();
      }
      dragStartIndex = -1;
      groupOffsets.clear();
    } else if (selectionBox) {
      selectionBox.remove();
      selectionBox = null;
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.classList.contains("letter") && !e.ctrlKey) {
      selectedLetters.forEach((letter) => {
        letter.classList.remove("selected");
      });
      selectedLetters.clear();
      groupOffsets.clear();
    }
  });

  document.addEventListener("mouseleave", (e) => {
    if (isDragging) {
      isDragging = false;
      if (draggedLetter) {
        draggedLetter.classList.remove("dragging");
        draggedLetter = null;
      } else if (draggedLetters.size > 0) {
        draggedLetters.forEach((letter) => {
          letter.classList.remove("dragging");
        });
        draggedLetters.clear();
      }
      dragStartIndex = -1;
      groupOffsets.clear();
    }
  });
});
