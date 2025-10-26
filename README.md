# Legion Security Riddle - Web Scraping Challenge

A fun web scraping challenge that involves finding 500 hidden pages and extracting secret numbers from each one.

## Challenge Description

Somewhere on this website, 500 pages are hiding in plain sight. Each one is guarding a secret number like a digital dragon hoarding treasure. Your job? Find them all!

## Install dependencies:

```bash
node riddle.js
```

## Project Structure

```
Legion/
├── riddle.js                    # Main riddle solver script
├── fetchAPIs.js                 # API data fetching utilities
├── RESULTS.md                   # Generated result          
└── README.md
```

## How It Works

### 1. API Data Fetching

The solution fetches all available pages from the Legion Riddle API and processes each page's HTML content.

### 2. JavaScript Pattern Analysis

For each page, the solver:

1. **Extracts JavaScript code** from `<script>` tags in the HTML
2. **Finds the longest array** in the JavaScript code using regex patterns
3. **Locates the variable just before** the longest array declaration
4. **Uses that variable's value as an index** to extract the secret number from the longest array
5. **Identifies real vs fake pages** - real pages contain valid JavaScript patterns, fake pages don't

### 3. Pattern Example

```javascript
const _4eljzcml = 35;           // Index variable
const _5f0bajye = [873,328,...]; // Longest array
// Result: secretNumber = _5f0bajye[35]
```

## Output

Generates `RESULTS.md` with:

- Total pages analyzed (500)
- Real vs fake page breakdown
- All secret numbers found
- **Grand total sum** of all valid numbers
- Success rate statistics
