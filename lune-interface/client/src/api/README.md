# API Layer

This directory contains the API layer for the application, which is built on top of Axios.

## Structure

-   `axiosClient.js`: The shared Axios instance. It includes interceptors for logging, error handling, and retries.
-   `diaryApi.js`: API functions related to diary entries, folders, and tags.
-   `luneApi.js`: API functions related to the Lune AI service.
-   `errors.js`: Custom error classes for the API layer.
-   `cancellation.js`: Helper function for request cancellation.

## Usage

### `axiosClient`

The `axiosClient` is a pre-configured Axios instance that can be used to make direct API calls. It includes:

-   A base URL configured from environment variables.
-   A 10-second timeout.
-   Interceptors for logging requests and responses.
-   Error handling for common HTTP status codes (401, 403, 429).
-   A retry mechanism for idempotent requests that fail with a 5xx error.

### API Functions

The `diaryApi.js` and `luneApi.js` files export functions for all the API calls in the application. These functions return a promise that resolves with the Axios response object.

**Example: Get all diary entries**

```javascript
import { getEntries } from './diaryApi';

async function fetchEntries() {
  try {
    const response = await getEntries();
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
```

### Error Handling

The API layer uses custom error classes defined in `errors.js`:

-   `ApiError`: For errors returned by the API (e.g., 4xx or 5xx status codes).
-   `NetworkError`: For network errors (e.g., no response from the server).
-   `CancelledError`: For when a request is cancelled.

You can use these error classes to handle different types of errors gracefully.

**Example: Error handling**

```javascript
import { getEntries } from './diaryApi';
import { ApiError, NetworkError } from './errors';

async function fetchEntries() {
  try {
    const response = await getEntries();
    console.log(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error: ${error.message}, Status: ${error.status}`);
    } else if (error instanceof NetworkError) {
      console.error(`Network Error: ${error.message}`);
    } else {
      console.error(`An unexpected error occurred: ${error.message}`);
    }
  }
}
```

### Request Cancellation

All API functions support request cancellation using an `AbortController`.

**Example: Request cancellation**

```javascript
import { getEntries } from './diaryApi';
import { getCancelToken } from './cancellation';

const controller = getCancelToken();

async function fetchEntries() {
  try {
    const response = await getEntries({ signal: controller.signal });
    console.log(response.data);
  } catch (error) {
    if (error.name === 'CancelledError') {
      console.log('Request was cancelled');
    } else {
      console.error(error);
    }
  }
}

// To cancel the request:
// controller.abort();
```
