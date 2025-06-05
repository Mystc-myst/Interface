document.addEventListener('DOMContentLoaded', () => {
  const diaryDataString = sessionStorage.getItem('diaryDataForEntriesPage');
  const entriesListOnEntriesPage = document.getElementById('entriesListOnEntriesPage');

  if (diaryDataString) {
    try {
      const diaryArray = JSON.parse(diaryDataString);
      renderEntriesOnPage(diaryArray);
    } catch (error) {
      console.error("Error parsing diary data from session storage:", error);
      entriesListOnEntriesPage.innerHTML = '<p>Error loading diary entries. Data might be corrupted.</p>';
    }
  } else {
    entriesListOnEntriesPage.innerHTML = '<p>No diary data found. Please <a href="index.html">open or create a diary</a> on the main page first.</p>';
  }
});

function renderEntriesOnPage(diaryArray) {
  const entriesListDiv = document.getElementById('entriesListOnEntriesPage');
  if (!entriesListDiv) return;

  entriesListDiv.innerHTML = ''; // Clear existing content

  // Sort entries by timestamp (newest first)
  const sortedEntries = diaryArray.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (sortedEntries.length === 0) {
    entriesListDiv.innerHTML = '<p>No entries to display.</p>';
    return;
  }

  for (const entry of sortedEntries) {
    const div = document.createElement('div');
    div.className = 'entry'; // Assuming a similar class 'entry' from main style.css

    const dateDiv = document.createElement('div');
    dateDiv.className = 'entry-date'; // Assuming a similar class
    dateDiv.textContent = new Date(entry.timestamp).toLocaleString();

    const textDiv = document.createElement('div');
    textDiv.className = 'entry-text'; // Assuming a similar class
    textDiv.textContent = entry.text;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'entry-buttons'; // Assuming a similar class

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      sessionStorage.setItem('editEntryId', entry.id);
      window.location.href = 'index.html';
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      if (!confirm('Delete this entry?')) return;

      // Filter the local diaryArray to remove the entry
      const updatedDiaryArray = diaryArray.filter(e => e.id !== entry.id);

      // Update the global diaryArray reference for subsequent renders on this page
      diaryArray.length = 0; // Clear original array
      updatedDiaryArray.forEach(e => diaryArray.push(e)); // Repopulate with filtered entries

      // Save the modified diaryArray back to sessionStorage
      sessionStorage.setItem('diaryDataForEntriesPage', JSON.stringify(diaryArray));
      // Set a flag in sessionStorage to indicate changes
      sessionStorage.setItem('diaryEntriesModified', 'true');

      // Re-render the entries list on this page
      renderEntriesOnPage(diaryArray);
    });

    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);

    div.appendChild(dateDiv);
    div.appendChild(textDiv);
    div.appendChild(buttonsDiv);

    entriesListDiv.appendChild(div);
  }
}
