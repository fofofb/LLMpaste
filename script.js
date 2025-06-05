document.addEventListener('DOMContentLoaded', () => {
    // Card related elements
    const addCardBtn = document.getElementById('add-card-btn');
    const cardsContainer = document.getElementById('cards-container');
    const cardTemplate = document.getElementById('card-template');
    const combineTextBtn = document.getElementById('combine-text-btn');

    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitleInput = document.getElementById('modal-title-input');
    const modalContentTextarea = document.getElementById('modal-content-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let cardCount = 0;
    let selectedCard = null; // Variable to store the currently selected card
    let cardBeingEdited = null; // Variable to store the card being edited via modal

    // --- Modal Functions ---
    function openEditModal(cardElement) {
        cardBeingEdited = cardElement;
        const currentTitle = cardElement.querySelector('.card-title').textContent;
        const currentContent = cardElement.querySelector('.card-content').textContent;

        modalTitleInput.value = currentTitle;
        modalContentTextarea.value = currentContent;
        editModal.style.display = 'block';
    }

    function closeEditModal() {
        editModal.style.display = 'none';
        cardBeingEdited = null;
        // Optionally clear fields:
        // modalTitleInput.value = '';
        // modalContentTextarea.value = '';
    }

    // Event listeners for modal buttons and window
    modalCloseBtn.addEventListener('click', closeEditModal);
    modalCancelBtn.addEventListener('click', closeEditModal);

    modalSaveBtn.addEventListener('click', () => {
        if (cardBeingEdited) {
            const newTitle = modalTitleInput.value.trim();
            const newContent = modalContentTextarea.value.trim();

            cardBeingEdited.querySelector('.card-title').textContent = newTitle || `Prompt Card ${cardBeingEdited.id.split('-')[1]}`; // Fallback title
            cardBeingEdited.querySelector('.card-content').textContent = newContent || 'Click "Edit" to add your prompt here.'; // Fallback content
        }
        closeEditModal();
    });

    window.addEventListener('click', (event) => {
        if (event.target == editModal) {
            closeEditModal();
        }
    });

    // --- Card Creation and Management ---
    function createAndSetupCard(initialTitle, initialContent) {
        cardCount++;
        const newCard = cardTemplate.content.cloneNode(true).querySelector('.card');
        newCard.id = `card-${cardCount}`;

        const cardTitleElement = newCard.querySelector('.card-title');
        const cardContentElement = newCard.querySelector('.card-content');

        if (cardTitleElement) {
            cardTitleElement.textContent = initialTitle || `Prompt Card ${cardCount}`;
        }
        if (cardContentElement) {
            cardContentElement.textContent = initialContent || 'Please edit to add content.';
        }

        cardsContainer.appendChild(newCard);

        // Card selection logic
        newCard.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' || event.target.closest('.modal-content')) {
                return;
            }
            if (selectedCard && selectedCard !== newCard) { // Ensure not deselecting then reselecting same card
                selectedCard.classList.remove('selected-card');
            }
            selectedCard = newCard;
            selectedCard.classList.add('selected-card');
        });

        // Add event listeners for new card buttons
        const editBtn = newCard.querySelector('.edit-btn');
        const copyBtn = newCard.querySelector('.copy-btn');
        const deleteBtn = newCard.querySelector('.delete-btn');

        if(editBtn) {
            editBtn.addEventListener('click', () => {
                openEditModal(newCard);
            });
        }

        if(copyBtn) {
            copyBtn.addEventListener('click', () => {
                const contentElement = newCard.querySelector('.card-content');
                if (contentElement) {
                    const textToCopy = contentElement.textContent;
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            const originalText = copyBtn.textContent;
                            copyBtn.textContent = 'Copied!';
                            setTimeout(() => {
                                copyBtn.textContent = originalText;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                            alert('Failed to copy text.');
                        });
                } else {
                    alert('No content to copy.');
                }
            });
        }

        if(deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                console.log(`Delete button clicked for ${newCard.id}`);
                if (selectedCard && selectedCard.id === newCard.id) {
                    selectedCard = null;
                }
                if (cardBeingEdited && cardBeingEdited.id === newCard.id) {
                    closeEditModal();
                }
                newCard.remove();
            });
        }
        return newCard; // Return the created card element
    }

    addCardBtn.addEventListener('click', () => {
        const newCard = createAndSetupCard(null, null); // Use default title/content
        openEditModal(newCard); // Open modal for the newly added card
    });

    combineTextBtn.addEventListener('click', async () => {
        if (!selectedCard) {
            alert('Please select a card first to combine its text with the clipboard.');
            return;
        }

        const cardContentElement = selectedCard.querySelector('.card-content');
        if (!cardContentElement) {
            alert('Could not find content in the selected card.');
            return;
        }
        const cardText = cardContentElement.textContent;

        try {
            const clipboardText = await navigator.clipboard.readText();
            if (typeof clipboardText !== 'string' || clipboardText.trim() === '') {
                alert('Clipboard is empty or does not contain text. Try copying some text first.');
                return;
            }
            const combinedText = cardText + "\n" + clipboardText;

            await navigator.clipboard.writeText(combinedText);

            const originalBtnText = combineTextBtn.textContent;
            combineTextBtn.textContent = 'Combined & Copied!';
            setTimeout(() => {
                combineTextBtn.textContent = originalBtnText;
            }, 3000);

        } catch (err) {
            console.error('Failed to read from or write to clipboard: ', err);
            if (err.name === 'NotFoundError' || (typeof clipboardText === 'undefined')) {
                 alert('Clipboard is empty or text could not be read. Try copying some text first.');
            } else if (err.name === 'NotAllowedError') {
                alert('Permission to access clipboard was denied. Please allow clipboard access in your browser settings.');
            } else {
                alert('Failed to combine text with clipboard. Error: ' + err.message);
            }
        }
    });

    // --- Keyboard Shortcuts ---
    document.addEventListener('keydown', function(event) {
        // Paste Text as New Card (Ctrl+Shift+V)
        if (event.ctrlKey && event.shiftKey && event.key === 'V') {
            event.preventDefault();
            navigator.clipboard.readText()
                .then(text => {
                    if (text && text.trim() !== '') {
                        const newCard = createAndSetupCard("Pasted Card", text);
                        openEditModal(newCard); // Open modal to refine
                    } else {
                        alert('Clipboard is empty or contains no text to paste.');
                    }
                })
                .catch(err => {
                    console.error('Failed to read from clipboard for paste: ', err);
                    if (err.name === 'NotAllowedError') {
                        alert('Permission to access clipboard was denied. Please allow clipboard access.');
                    } else {
                        alert('Failed to paste text from clipboard. See console for details.');
                    }
                });
        }

        // Copy Combined Card Shortcut (Ctrl+Shift+C)
        if (event.ctrlKey && event.shiftKey && event.key === 'C') {
            event.preventDefault();
            combineTextBtn.click(); // Programmatically click the existing button
        }
    });
});
