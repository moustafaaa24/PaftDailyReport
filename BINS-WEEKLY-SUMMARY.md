# Bins Weekly Report - Summary

## What Changed

The weekly report has been completely redesigned to focus on **Bins data** over the last 5 days, with emphasis on:

### 1. EnterLock Warehouse
- Tracks "Needed Bins in EnterLock WH" 
- Maximum capacity: 42 bins
- Shows daily trends and capacity percentage
- Color-coded alerts:
  - 🟢 Green (Good): 0-24 bins
  - 🟡 Yellow (Warning): 25-34 bins  
  - 🔴 Red (Critical): 35-42 bins

### 2. Row Material Issues (3 Categories)
- **Spring Repair**: Bins requiring spring maintenance
- **Scanning Issues**: Bins with scanning problems
- **Need Cement**: Bins requiring cement

## Dashboard Sections

### Summary Cards (Top Row) - Latest Values
- **Latest EnterLock Bins** (Blue) - Most recent count
- **Latest Spring Repair** (Yellow) - Most recent count
- **Latest Scanning Issues** (Cyan) - Most recent count
- **Latest Need Cement** (Green) - Most recent count

*These show the most recent data from the last 5 days, not averages.*

### Trend Charts
1. **EnterLock Bins Trend**: Line chart showing daily EnterLock bins (0-42 scale)
2. **Row Material Issues Trend**: Multi-line chart with all 3 categories

### Bins Overview Table
Complete daily breakdown with:
- Date
- EnterLock count (blue badge)
- Spring Repair (red badge)
- Scanning Issues (cyan badge)
- Need Cement (green badge)
- Total Row Material (bold)

### Row Material Distribution
Pie chart showing the proportion of each issue type across all 5 days

### Key Insights
Smart analysis including:
- EnterLock capacity trends
- Most common row material issue
- Capacity warnings
- Actionable recommendations

### Daily Breakdown Cards
Individual cards for each day showing:
- Status badge (Good/Warning/Critical)
- Capacity percentage
- All bin counts with icons
- Color-coded values

## Data Source

All data comes from the **binLocation** sheet with these columns:
- `Date` - Date of the record
- `Needed Bins in EnterLock WH` - EnterLock bins count
- `Row Material Spring Repair` - Spring repair count
- `Row Material Issue in Scanning` - Scanning issues count
- `Row Material need Cement` - Cement needed count

## Color Coding

- **EnterLock**: Blue (#1DB9E8)
- **Spring Repair**: Red (#FF6384)
- **Scanning Issues**: Cyan (#36A2EB)
- **Need Cement**: Yellow (#FFCE56)

## Insights Examples

✅ "EnterLock bins decreased from 30 to 25 (5 fewer bins needed)."  
⚠️ "Spring Repair is the most common row material issue with 45 bins affected over 5 days."  
🔴 "EnterLock warehouse is at 83.3% capacity (35/42). Consider urgent action."  
ℹ️ "Average of 8 row material bins with issues per day."

## Access

Click the **"Weekly Report"** button in the daily report header to view the bins weekly analysis.
