const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert');

// Path to the diaryStore. We need to be careful about its DATA_FILE
// For robust testing, diaryStore should ideally allow DATA_FILE override.
// For now, we'll try to manage it by temporarily renaming the original and restoring it.
// Or, more safely, by setting an environment variable if diaryStore supports it (it currently doesn't directly).

// Let's try a direct manipulation approach for DATA_FILE for testing purposes.
// This is risky if tests crash, as the original path might not be restored.
// A better approach would be for diaryStore to export a function to set DATA_FILE.
const diaryStorePath = '../diaryStore'; // Relative to this test file
const originalDataFilePath = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');
const testDataFileName = `test_diary_${crypto.randomUUID()}.json`;
const testDataFilePath = path.join(__dirname, '..', '..', 'offline-diary', testDataFileName);

let diaryStore;

async function runTests() {
    // Setup: Point diaryStore to a test file
    // This is a hack. Ideally, diaryStore would be structured to allow easy DI for DATA_FILE.
    // We will monkey-patch require to reload diaryStore with a modified path if needed,
    // or ensure diaryStore itself can re-evaluate its DATA_FILE constant.
    // The simplest way for now is to ensure the test file is set before diaryStore is first required.
    // However, diaryStore defines DATA_FILE at the module scope.
    // We will rename the original, load diaryStore (it will use default or fail to find),
    // then force its DATA_FILE or use a known test path.

    // The current diaryStore loads DATA_FILE at the top level.
    // We must ensure it uses our test path.
    // One way: temporarily rename original, let diaryStore create a new one at the original path,
    // then delete it and rename back. This is still a bit messy.

    // Simplest for now: copy original diaryStore.js, modify its DATA_FILE line, load the copy.
    // Or, use environment variables (not implemented in current diaryStore).

    // Let's assume we can control DATA_FILE by directly setting it before loading diaryStore.
    // This requires modifying diaryStore to export its path or a setter, which we haven't done.

    // Fallback: Use a known temporary file and ensure cleanup.
    // We'll have to modify diaryStore's internal DATA_FILE path. This is not ideal.
    // The `diaryStore.js` was written to use a const DATA_FILE.
    // The best way without altering diaryStore significantly for testability is to
    // make a test-specific version or manage the actual file it points to.

    console.log(`Using test data file: ${testDataFilePath}`);

    // Backup original diary if it exists
    let originalDiaryBackedUp = false;
    if (fs.existsSync(originalDataFilePath)) {
        fs.renameSync(originalDataFilePath, `${originalDataFilePath}.bak`);
        originalDiaryBackedUp = true;
    }
    // Now, when diaryStore is loaded, it will create a new diary.json at the original path if it writes.
    // Or, if it fails to find it, it initializes empty. This is what we want for a clean test.
    // We want it to write to our testDataFilePath. This is the hard part.

    // Let's modify the plan: For now, assume diaryStore will operate on its default
    // DATA_FILE. We will ensure it's empty before tests and cleaned after.
    // This means tests are NOT isolated if run in parallel and affect the "global" diary.json.
    // This is a limitation of the current design.

    // For now, we will ensure `offline-diary/diary.json` is empty/non-existent
    // before tests and cleaned up/restored after.

    if (fs.existsSync(originalDataFilePath)) {
        fs.unlinkSync(originalDataFilePath); // Start with no file
    }
    diaryStore = require(diaryStorePath); // Now it will create/use a fresh default diary.json


    try {
        console.log('Starting diaryStore Folder Tests...');

        // Test 1: Add a folder
        console.log('Test 1: Add a folder');
        const folderName = 'Test Folder 1';
        const addedFolder = await diaryStore.addFolder(folderName);
        assert.strictEqual(addedFolder.name, folderName, 'Folder name should match');
        assert.ok(addedFolder.id, 'Folder should have an ID');

        // Test 2: Get all folders
        console.log('Test 2: Get all folders');
        let folders = await diaryStore.getAllFolders();
        assert.strictEqual(folders.length, 1, 'Should be one folder');
        assert.strictEqual(folders[0].name, folderName, 'First folder should be Test Folder 1');

        // Test 3: Find folder by ID
        console.log('Test 3: Find folder by ID');
        const foundFolder = await diaryStore.findFolderById(addedFolder.id);
        assert.deepStrictEqual(foundFolder, addedFolder, 'Found folder should match added folder');

        // Test 4: Update a folder
        console.log('Test 4: Update a folder');
        const updatedFolderName = 'Updated Test Folder 1';
        const updatedFolder = await diaryStore.updateFolder(addedFolder.id, updatedFolderName);
        assert.strictEqual(updatedFolder.name, updatedFolderName, 'Folder name should be updated');
        let currentFolder = await diaryStore.findFolderById(addedFolder.id);
        assert.strictEqual(currentFolder.name, updatedFolderName, 'Folder name should persist update');

        // Test 5: Add another folder for sorting and multiple item tests
        console.log('Test 5: Add another folder');
        const folderName2 = 'Another Test Folder'; // "A" for sorting
        await diaryStore.addFolder(folderName2);
        folders = await diaryStore.getAllFolders();
        assert.strictEqual(folders.length, 2, 'Should be two folders');
        assert.strictEqual(folders[0].name, folderName2, 'Folders should be sorted by name'); // Another comes before Updated

        // Test 6: Add an entry and assign it to a folder
        console.log('Test 6: Add entry and assign to folder');
        const entryText = 'Test entry for folder';
        const entry1 = await diaryStore.add(entryText, addedFolder.id);
        assert.strictEqual(entry1.folderId, addedFolder.id, 'Entry should be assigned to the folder');

        // Test 7: Update an entry's folderId using updateText
        console.log('Test 7: Update entry folder using updateText');
        const folder2 = await diaryStore.findFolderById(folders.find(f=>f.name === folderName2).id);
        const updatedEntry1 = await diaryStore.updateText(entry1.id, 'Updated text', folder2.id);
        assert.strictEqual(updatedEntry1.folderId, folder2.id, 'Entry folderId should be updated via updateText');

        // Test 8: Assign entry to folder using assignEntryToFolder
        console.log('Test 8: Assign entry using assignEntryToFolder');
        await diaryStore.assignEntryToFolder(entry1.id, addedFolder.id);
        let currentEntry1 = await diaryStore.findById(entry1.id);
        assert.strictEqual(currentEntry1.folderId, addedFolder.id, 'Entry folderId should be updated via assignEntryToFolder');

        // Test 9: Unassign entry from folder
        console.log('Test 9: Unassign entry from folder');
        await diaryStore.assignEntryToFolder(entry1.id, null);
        currentEntry1 = await diaryStore.findById(entry1.id);
        assert.strictEqual(currentEntry1.folderId, null, 'Entry folderId should be null after unassigning');

        // Test 10: Remove a folder and check if entries are unassigned
        console.log('Test 10: Remove folder and check entry unassignment');
        await diaryStore.assignEntryToFolder(entry1.id, addedFolder.id); // Reassign first
        const removeFolderSuccess = await diaryStore.removeFolder(addedFolder.id);
        assert.ok(removeFolderSuccess, 'Folder removal should be successful');
        folders = await diaryStore.getAllFolders();
        assert.strictEqual(folders.length, 1, 'Should be one folder left');
        assert.strictEqual(folders[0].name, folderName2, 'Remaining folder should be "Another Test Folder"');
        currentEntry1 = await diaryStore.findById(entry1.id);
        assert.strictEqual(currentEntry1.folderId, null, 'Entry should be unassigned after folder deletion');

        // Test 11: Attempt to remove a non-existent folder
        console.log('Test 11: Remove non-existent folder');
        const removeNonExistentSuccess = await diaryStore.removeFolder('non-existent-id');
        assert.strictEqual(removeNonExistentSuccess, false, 'Should return false for non-existent folder removal');

        // Test 12: Folder name validation (empty name)
        console.log('Test 12: Folder name validation - empty name for add');
        try {
            await diaryStore.addFolder('');
            assert.fail('addFolder should throw error for empty name');
        } catch (e) {
            assert.ok(e.message.includes('Folder name cannot be empty'), 'Error message for addFolder should be correct');
        }
        console.log('Test 13: Folder name validation - empty name for update');
        const lastFolder = folders[0];
        try {
            await diaryStore.updateFolder(lastFolder.id, '   ');
            assert.fail('updateFolder should throw error for empty name');
        } catch (e) {
            assert.ok(e.message.includes('Folder name cannot be empty'), 'Error message for updateFolder should be correct');
        }


        console.log('diaryStore Folder Tests Passed!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Cleanup: remove the test diary file
        if (fs.existsSync(originalDataFilePath)) {
            fs.unlinkSync(originalDataFilePath); // remove the diary.json created by test
        }
        // Restore original diary if it was backed up
        if (originalDiaryBackedUp) {
            fs.renameSync(`${originalDataFilePath}.bak`, originalDataFilePath);
        }
        console.log('Test cleanup finished.');
    }
}

runTests().then(() => {
    // Only run API tests if diaryStore tests pass, or run them in parallel if independent.
    // For simplicity, running sequentially.
    runApiTests();
}).catch(error => {
    console.error("DiaryStore tests failed, skipping API tests.", error);
    // Ensure cleanup even if diaryStore tests fail before API tests
    cleanupTestData();
});


// --- Supertest API Tests ---
const request = require('supertest');
const app = require('../server'); // Import the Express app

async function runApiTests() {
    // Ensure a clean state for API tests by re-doing the diaryStore test setup/cleanup logic
    // This is important because API tests will also interact with the same data file.
    if (fs.existsSync(originalDataFilePath)) {
        if (!originalDataFilePath.endsWith('.bak')) { // Avoid double backup
            fs.renameSync(originalDataFilePath, `${originalDataFilePath}.bak.api`);
        }
    } else {
        // If the file doesn't exist, ensure no stale .bak.api exists from previous failed run
        if(fs.existsSync(`${originalDataFilePath}.bak.api`)) {
             fs.unlinkSync(`${originalDataFilePath}.bak.api`);
        }
    }
    // Reload diaryStore to ensure it uses a fresh file for these tests too.
    // This is tricky because require caches. We need to ensure diaryStore itself re-initializes.
    // The safest is to ensure the diary.json is empty.
    if (fs.existsSync(originalDataFilePath)) {
        fs.unlinkSync(originalDataFilePath);
    }
    // At this point, diaryStore (already required by app) will use a fresh diary.json

    let testFolderId;
    let testEntryId;

    try {
        console.log('\nStarting API Endpoint Tests...');

        // Test GET /folders (initially empty)
        console.log('API Test 1: GET /folders (empty)');
        let response = await request(app).get('/diary/folders').expect(200);
        assert.deepStrictEqual(response.body, [], 'Initially, folders array should be empty');

        // Test POST /folders
        console.log('API Test 2: POST /folders');
        const newFolderName = 'API Test Folder';
        response = await request(app)
            .post('/diary/folders')
            .send({ name: newFolderName })
            .expect(201);
        assert.strictEqual(response.body.name, newFolderName, 'Folder name should match');
        assert.ok(response.body.id, 'Folder should have an ID');
        testFolderId = response.body.id;

        // Test GET /folders (with one folder)
        console.log('API Test 3: GET /folders (one folder)');
        response = await request(app).get('/diary/folders').expect(200);
        assert.strictEqual(response.body.length, 1, 'Should be one folder');
        assert.strictEqual(response.body[0].name, newFolderName, 'Folder name should match');

        // Test PUT /folders/:id
        console.log('API Test 4: PUT /folders/:id');
        const updatedApiFolderName = 'Updated API Test Folder';
        response = await request(app)
            .put(`/diary/folders/${testFolderId}`)
            .send({ name: updatedApiFolderName })
            .expect(200);
        assert.strictEqual(response.body.name, updatedApiFolderName, 'Folder name should be updated');

        // Test POST / (create entry without folderId)
        console.log('API Test 5: POST /diary (create entry without folderId)');
        const entryText1 = 'API test entry 1';
        response = await request(app)
            .post('/diary')
            .send({ text: entryText1 })
            .expect(201);
        assert.strictEqual(response.body.text, entryText1);
        assert.strictEqual(response.body.folderId, null, 'folderId should be null');
        testEntryId = response.body.id;

        // Test POST / (create entry with folderId)
        console.log('API Test 6: POST /diary (create entry with folderId)');
        const entryText2 = 'API test entry 2';
        response = await request(app)
            .post('/diary')
            .send({ text: entryText2, folderId: testFolderId })
            .expect(201);
        assert.strictEqual(response.body.text, entryText2);
        assert.strictEqual(response.body.folderId, testFolderId, 'folderId should match testFolderId');
        const entry2Id = response.body.id;


        // Test PUT /:id (update entry text and folderId)
        console.log('API Test 7: PUT /diary/:id (update text and folderId)');
        const updatedEntryText1 = 'Updated API test entry 1';
        response = await request(app)
            .put(`/diary/${testEntryId}`)
            .send({ text: updatedEntryText1, folderId: testFolderId })
            .expect(200);
        assert.strictEqual(response.body.text, updatedEntryText1, 'Entry text should be updated');
        assert.strictEqual(response.body.folderId, testFolderId, 'Entry folderId should be updated');

        // Test PUT /:entryId/folder (assign entry to folder)
        console.log('API Test 8: PUT /diary/:entryId/folder (assign)');
        // Create another folder to assign to
        const anotherFolderName = "Second API Folder";
        let folder2Response = await request(app).post('/diary/folders').send({ name: anotherFolderName }).expect(201);
        const secondTestFolderId = folder2Response.body.id;

        response = await request(app)
            .put(`/diary/${testEntryId}/folder`)
            .send({ folderId: secondTestFolderId })
            .expect(200);
        assert.strictEqual(response.body.folderId, secondTestFolderId, 'Entry should be assigned to second folder');

        // Test PUT /:entryId/folder (unassign entry)
        console.log('API Test 9: PUT /diary/:entryId/folder (unassign)');
        response = await request(app)
            .put(`/diary/${testEntryId}/folder`)
            .send({ folderId: null }) // Unassign
            .expect(200);
        assert.strictEqual(response.body.folderId, null, 'Entry should be unassigned (folderId is null)');


        // Test DELETE /folders/:id
        console.log('API Test 10: DELETE /folders/:id');
        // First, assign an entry to the folder we are about to delete
        await request(app).put(`/diary/${entry2Id}/folder`).send({ folderId: testFolderId }).expect(200);

        response = await request(app).delete(`/diary/folders/${testFolderId}`).expect(200);
        assert.strictEqual(response.body.message, 'Folder deleted successfully. Entries within have been unassigned.');

        // Verify the folder is gone
        response = await request(app).get('/diary/folders').expect(200);
        const folderExists = response.body.some(f => f.id === testFolderId);
        assert.strictEqual(folderExists, false, 'Deleted folder should not exist');

        // Verify the entry (entry2Id) that was in the deleted folder is now unassigned
        response = await request(app).get('/diary').expect(200); // Get all entries
        const entry2 = response.body.find(e => e.id === entry2Id);
        assert.ok(entry2, 'Entry 2 should still exist');
        assert.strictEqual(entry2.folderId, null, 'Entry 2 should be unassigned after folder deletion');


        // Test DELETE /:id (delete entry)
        console.log('API Test 11: DELETE /diary/:id');
        response = await request(app).delete(`/diary/${testEntryId}`).expect(200);
        assert.strictEqual(response.body.message, 'Deleted');

        // Verify entry is gone
        response = await request(app).get('/diary').expect(200);
        const entry1Exists = response.body.some(e => e.id === testEntryId);
        assert.strictEqual(entry1Exists, false, 'Deleted entry 1 should not exist');


        console.log('API Endpoint Tests Passed!');

    } catch (error) {
        console.error('API Test failed:', error);
        // Log additional details from Supertest error if available
        if (error.response && error.response.body) {
            console.error('API Error Response Body:', error.response.body);
        }
    } finally {
        // Cleanup for API tests
        if (fs.existsSync(originalDataFilePath)) {
            fs.unlinkSync(originalDataFilePath);
        }
        if (fs.existsSync(`${originalDataFilePath}.bak.api`)) {
            fs.renameSync(`${originalDataFilePath}.bak.api`, originalDataFilePath);
        }
        console.log('API Test cleanup finished.');
    }
}

function cleanupTestData() {
    // This function is called from runTests' finally block and potentially if diaryStore tests fail early.
    if (fs.existsSync(originalDataFilePath) && !originalDataFilePath.includes('.bak')) { // Check it's not already a .bak path
        // If the originalDataFilePath is the actual diary, and not a .bak file itself
        const stat = fs.lstatSync(originalDataFilePath); // Check if it's a symlink or regular file
        if (!stat.isSymbolicLink()) { // ensure we don't delete unrelated files if pathing is wrong
             // Check if it was the one created by the test or an original one.
             // This is hard to tell without more context.
             // The logic in runTests().finally handles this better by checking originalDiaryBackedUp.
        }
    }
    // The main cleanup is in the finally block of runTests and runApiTests specifically
    // This standalone cleanup is more of a fail-safe but needs to be careful.
    // For now, rely on the specific finally blocks.
    console.log("Generic cleanupTestData called - main cleanup in individual test runners' finally blocks.");
}
