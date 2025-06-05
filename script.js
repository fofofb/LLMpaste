document.addEventListener('DOMContentLoaded', () => {
    const addCardBtn = document.getElementById('add-card-btn');
    const cardsContainer = document.getElementById('cards-container');
    const cardTemplate = document.getElementById('card-template');
    const combineTextBtn = document.getElementById('combine-text-btn');

    let cardCount = 0;
    let selectedCard = null; // Variable to store the currently selected card

    addCardBtn.addEventListener('click', () => {
        cardCount++;
        const newCard = cardTemplate.content.cloneNode(true).querySelector('.card');
        newCard.id = `card-${cardCount}`; // Set a unique ID for the card

        // Card selection logic
        newCard.addEventListener('click', (event) => {
            // Prevent selection logic when clicking on buttons within the card
            if (event.target.tagName === 'BUTTON' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            if (selectedCard) {
                selectedCard.classList.remove('selected-card');
            }
            selectedCard = newCard;
            selectedCard.classList.add('selected-card');
        });

        // Update title
        const cardTitle = newCard.querySelector('.card-title');
        if (cardTitle) {
            cardTitle.textContent = `Prompt Card ${cardCount}`;
        }

        // Update content
        const cardContent = newCard.querySelector('.card-content');
        if (cardContent) {
            cardContent.textContent = 'Click "Edit" to add your prompt here.';
        }

        cardsContainer.appendChild(newCard);

        // Add event listeners for new card buttons
        const editBtn = newCard.querySelector('.edit-btn');
        const copyBtn = newCard.querySelector('.copy-btn');
        const deleteBtn = newCard.querySelector('.delete-btn');

        if(editBtn) {
            editBtn.addEventListener('click', () => { // Removed unused _current_card_content_p
                const cardContentElement = newCard.querySelector('.card-content');
                const currentText = cardContentElement ? cardContentElement.textContent : '';

                if (editBtn.textContent === 'Edit') {
                    const textArea = document.createElement('textarea');
                    textArea.value = currentText;
                    textArea.style.width = '90%';
                    textArea.style.height = '100px';
                    if(cardContentElement) cardContentElement.replaceWith(textArea);
                    else newCard.insertBefore(textArea, editBtn); // Fallback if p was already removed
                    textArea.focus();
                    editBtn.textContent = 'Save';
                } else {
                    const newParagraph = document.createElement('p');
                    newParagraph.classList.add('card-content');
                    const textArea = newCard.querySelector('textarea');
                    newParagraph.textContent = textArea ? textArea.value : '';
                    if(textArea) textArea.replaceWith(newParagraph);
                    editBtn.textContent = 'Edit';
                }
            });
        }

        if(copyBtn) {
            copyBtn.addEventListener('click', () => {
                const cardContentElement = newCard.querySelector('.card-content') || newCard.querySelector('textarea');
                if (cardContentElement) {
                    const textToCopy = cardContentElement.value || cardContentElement.textContent;
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            const originalText = copyBtn.textContent; // Defined originalText here
                            copyBtn.textContent = 'Copied!';
                            setTimeout(() => {
                                copyBtn.textContent = originalText;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy text: ', err);
                            alert('Failed to copy text.');
                        });
                }
            });
        }

        if(deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                console.log(`Delete button clicked for ${newCard.id}`);
                if (selectedCard && selectedCard.id === newCard.id) {
                    selectedCard = null; // Clear selection if the selected card is deleted
                }
                newCard.remove();
            });
        }
    });

    combineTextBtn.addEventListener('click', async () => {
        if (!selectedCard) {
            alert('Please select a card first to combine its text with the clipboard.');
            return;
        }

        const cardContentElement = selectedCard.querySelector('.card-content') || selectedCard.querySelector('textarea');
        if (!cardContentElement) {
            alert('Could not find content in the selected card.');
            return;
        }
        const cardText = cardContentElement.value || cardContentElement.textContent;

        try {
            const clipboardText = await navigator.clipboard.readText();
            const combinedText = cardText + "\n" + clipboardText;

            await navigator.clipboard.writeText(combinedText);

            const originalBtnText = combineTextBtn.textContent;
            combineTextBtn.textContent = 'Combined & Copied!';
            setTimeout(() => {
                combineTextBtn.textContent = originalBtnText;
            }, 3000); // Revert after 3 seconds

        } catch (err) {
            console.error('Failed to read from or write to clipboard: ', err);
            if (err.name === 'NotFoundError') {
                 alert('Clipboard is empty or text could not be read.');
            } else if (err.name === 'NotAllowedError') {
                alert('Permission to access clipboard was denied. Please allow clipboard access in your browser settings.');
            } else {
                alert('Failed to combine text with clipboard. See console for details.');
            }
        }
    });
});
