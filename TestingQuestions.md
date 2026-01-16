# 🏠 Real Estate AI Assistant - Demo Questions

This file contains test questions to showcase the key features of the Real Estate AI Assistant, organized by data type and question type. 

## 📊 Sales Data Questions

### 🔹 Descriptive (What happened?)
- How many transactions occurred in Yas Island in 2024? → `get_transaction_count`

### 🔹 Comparative (Where is it higher/lower?)
- Compare sale prices between Yas Island and AL REEM ISLAND → `compare_sales_between_districts`

## 🏠 Rental Data Questions

### 🔹 Descriptive
- Find me a 3BR appartment with a budget of AED 100,000 → `find_units_by_budget`

### 🔹 Comparative
*No rental comparison tools currently available*

## 📦 Supply Data Questions

### 🔹 Descriptive
- What is the current housing supply by community? → `get_current_supply`
- What is the total number of 2BR units in YN7 for 2024? → `get_current_supply`

### 🔹 Comparative
*No supply comparison tools currently available*

### Advanced Analysis
- Show me top 5 districts by sales in Abu Dhabi City for 2023 → `get_top_districts_in_municipality`
- Find properties in Yas Island for budget 300,000 AED → `find_units_by_budget`

## 🌍 Multilingual Support

### Arabic Queries
- كم عدد المعاملات في جزيرة ياس في العام 2024؟ → `get_transaction_count`
- قارن المبيعات بين جزيرة ياس وجزيرة الريم في العام 2024 → `compare_sales_between_districts`
- اعرض أفضل 5 مناطق من حيث المبيعات في أبو ظبي لعام 2023 → `get_top_districts_in_municipality`
- ابحث عن شقة 3 غرف نوم بميزانية 100,000 درهم → `find_units_by_budget`

### Mixed Language Conversations
- Tell me about Yas Island
- كم عدد المعاملات هناك؟ → `get_transaction_count`
- Compare with AL REEM ISLAND
- وكم في جزيرة الريم؟ → `get_transaction_count`

---
