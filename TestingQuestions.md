# 🏠 Real Estate AI Assistant - Demo Questions

This file contains test questions to showcase the key features of the Real Estate AI Assistant, organized by data type and question type. **Only questions we can currently answer with our tools are included.**

## 📊 Sales Data Questions

### 🔹 Descriptive (What happened?)
- How many transactions occurred in Yas Island in 2024? → `get_transaction_count`
- Which projects had the highest number of sales this year? → `get_top_districts_in_municipality`

### 🔹 Comparative (Where is it higher/lower?)
- Compare sale prices between Yas Island and AL REEM ISLAND → `compare_sales_between_districts`
- Which district has higher sales volume: AL REEM ISLAND or Yas? → `compare_sales_between_districts`

## 🏠 Rental Data Questions

### 🔹 Descriptive
- With a budget of AED 100,000, which communities can I find a 3BR apartment in? → `find_units_by_budget`

### 🔹 Comparative
*No rental comparison tools currently available*

## 📦 Supply Data Questions

### 🔹 Descriptive
- What is the current housing supply by community? → `get_current_supply`
- What is the total number of 2BR units in YN7 for 2024? → `get_current_supply`

### 🔹 Comparative
*No supply comparison tools currently available*

## 🎯 Additional Supported Queries

### Location & Metadata
- What districts are in Abu Dhabi City? → `get_districts`
- Tell me about Yas Island → `search_geospatial_metadata`
- جزيرة ياس معلومات → `search_geospatial_metadata`

### Advanced Analysis
- Show me top 5 districts by sales in Abu Dhabi City for 2023 → `get_top_districts_in_municipality`
- Find properties in Yas Island for budget 300,000 AED → `find_units_by_budget`

## 🌍 Multilingual Support

### Arabic Queries
- كم عدد المعاملات في جزيرة ياس في العام 2024؟ → `get_transaction_count`
- قارن المبيعات بين جزيرة ياس وجزيرة الريم في العام 2024 → `compare_sales_between_districts`
- اعرض أفضل 5 مناطق من حيث المبيعات في أبو ظبي لعام 2023 → `get_top_districts_in_municipality`

### Mixed Language Conversations
- Tell me about Yas Island
- كم عدد المعاملات هناك؟ → `get_transaction_count`
- Compare with AL REEM ISLAND
- وكم في جزيرة الريم؟ → `get_transaction_count`

---

## 🎬 Demo Script (8-10 minutes)

**Opening - Chart Visualization:**
1. *"Compare sales between Yas Island and AL REEM ISLAND in 2024"* → Auto-opens chart
2. *"Show me top 5 districts in Abu Dhabi City for 2023"* → Another chart

**Context Awareness Demo:**
3. *"How many transactions occurred in Yas Island in 2024?"*
4. *"What about AL REEM ISLAND?"* (AI remembers context)
5. *"Compare their sales in 2024"* (AI remembers both locations)

**Multilingual Demo:**
6. *"كم عدد المعاملات في جزيرة ياس في العام 2024؟"*
7. *"قارن مع جزيرة السعديات"*

**Budget Search:**
8. *"Find 2-bedroom apartments in Yas Island under 150,000 AED per year"*

**Supply Information:**
9. *"What is the current housing supply in Yas Island?"*

---

## 🛠️ Current Tool Capabilities

**Available Tools:** 10
- `search_geospatial_metadata` - Location validation and info
- `get_total_sales_value` - Sales value by district/year
- `get_transaction_count` - Transaction volume by district/year
- `compare_sales_between_districts` - Compare two districts
- `find_units_by_budget` - Budget-based rental search
- `get_current_supply` - Current housing supply
- `get_municipality_sales` - Municipality-level sales
- `get_top_districts_in_municipality` - Top districts by sales
- `get_districts` - List districts in municipality
- `get_communities` - List communities

**Total Answerable Questions:** ~8-10 from the original list

---

*Last updated: January 17, 2026*
*Demo Focus: Chart Auto-Display, Context Awareness, Multilingual Support*</content>
<parameter name="filePath">d:\sandbox\Real States Smart Assistant\geo_assistant\TestingQuestions.md