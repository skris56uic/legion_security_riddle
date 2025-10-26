# Legion Security Riddle - Web Scraping Challenge

A fun web scraping challenge that involves finding 500 hidden pages and extracting secret numbers from each one.

## Challenge Description

Somewhere on this website, 500 pages are hiding in plain sight. Each one is guarding a secret number like a digital dragon hoarding treasure. Your job? Find them all!

## Install dependencies:
```bash
npm install
npx run cy:run
```

## Project Structure

```
Legion/
├── cypress/
│   ├── e2e/
│   │   └── riddle.cy.ts          # Main test automation script
│   └── support/
│       ├── fetchAPIs.ts          # API data fetching utilities
│       └── saveResultToFile.ts   # File saving utilities
├── results/                      # Generated result files
├── cypress.config.ts            # Cypress configuration
└── README.md
```

## How It Works

### 1. API Data Fetching
The solution starts by fetching all available pages from the Legion Riddle API:

```typescript
// Fetches paginated data from all available pages
const fetchAllPages = async () => {
  // Gets pagination info and fetches all pages
  // Combines results from multiple API calls
}
```

### 2. Page Processing Algorithm

For each valid page, the automation:

1. **Clicks all 5 buttons** at the top of the page (required to reveal hidden numbers)
2. **Expands the "Important Information Table"** section
3. **Searches for numbers** in both left and right columns:
   - Checks `#number-placeholder-right span[class^="val"]` first
   - Falls back to `#number-placeholder-left span[class^="val"]` if right is empty
4. **Handles failures gracefully** - skips pages that return 404 or missing elements
5. **Logs progress** for each page processed

## Output

The solution generates detailed result files in the `results/` directory:

```
Legion Security Riddle - Results Summary
=======================================
Timestamp: 2025-10-26T...
Total Pages Processed: 500
Numbers Found: [123, 456, 789, ...]
Total Count of Numbers: 500
Total Sum: 125000
```