# Weekly Bins Report Feature

## Overview
The Weekly Report Dashboard provides a comprehensive summary and insights for the last 5 days of bins data, focusing on EnterLock warehouse and Row Material issues.

## Features

### 1. Summary Metrics (Latest Values)
- **Latest EnterLock Bins**: Shows the most recent number of bins needed in EnterLock WH
- **Latest Spring Repair**: Most recent bins requiring spring repair
- **Latest Scanning Issues**: Most recent bins with scanning problems
- **Latest Need Cement**: Most recent bins requiring cement

*Note: These cards display the latest/most recent data from the last 5 days, not averages.*

### 2. Trend Charts
- **EnterLock Bins Trend**: Line chart showing EnterLock bins needed over 5 days (max capacity: 42)
- **Row Material Issues Trend**: Multi-line chart displaying all three row material categories:
  - Spring Repair (Red)
  - Scanning Issues (Blue)
  - Need Cement (Yellow)

### 3. Bins Overview Table
- Comprehensive table showing daily data:
  - Date
  - EnterLock Bins count
  - Spring Repair count
  - Scanning Issues count
  - Need Cement count
  - Total Row Material issues

### 4. Row Material Distribution
- Pie chart showing the breakdown of row material issues:
  - Spring Repair
  - Scanning Issues
  - Need Cement
- Helps visualize which issue type is most common

### 5. Key Insights
- Automatically generated insights based on bins data analysis:
  - EnterLock bins trend (increase/decrease)
  - Most common row material issue
  - Average daily row material issues
  - EnterLock capacity warnings
  - Actionable recommendations

### 6. Daily Bins Breakdown
- Day-by-day summary cards showing:
  - Date and day name
  - Status badge (Good/Warning/Critical based on EnterLock capacity)
  - Capacity percentage
  - EnterLock bins (out of 42)
  - Spring Repair count
  - Scanning Issues count
  - Need Cement count
  - Total Row Material issues

## How to Access

### From Daily Report
Click the **"Weekly Report"** button in the header of the daily report dashboard.

### Direct Access
Navigate to `weekly-report.html` in your browser.

## Navigation
- **Daily Report Button**: Returns to the daily report view
- **Print PDF**: Generates a printer-friendly version
- **Refresh**: Reloads data from Google Sheets

## Data Source
The weekly report pulls data from the same Google Sheets as the daily report, analyzing the last 5 days of entries.

## Technical Details

### Files
- `weekly-report.html` - Main HTML structure
- `weekly-report.js` - Data processing and visualization logic
- `weekly-styles.css` - Weekly report specific styling

### Data Processing
1. Fetches all sheets from Google Sheets
2. Filters data for the last 5 days
3. Aggregates metrics across all days
4. Generates insights based on trends
5. Updates visualizations and summaries

### Responsive Design
- Fully responsive layout
- Mobile-optimized views
- Print-friendly formatting

## Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers

## Notes
- Data is refreshed every time the page loads
- Requires internet connection to fetch Google Sheets data
- Best viewed on screens 1024px or wider for optimal experience
