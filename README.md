# Dynamic Itinerary Canvas (CanvasX)

**A real-time collaborative travel planning tool with AI-assisted itinerary generation**  

---

## Project Overview

CanvasX is a **real-time collaborative travel planning application**, developed as part of the **TRAVEL-WIZARD Feature Innovation Challenge**.  

It enables group travelers to:  

- Visualize and plan their trips on a dynamic "itinerary canvas."  
- Collaborate in real-time with friends or family.  
- Receive AI-assisted recommendations for destinations, hotels, restaurants, and attractions.  
- Vote on options and automatically generate optimized itineraries.  
- Adjust and rearrange the itinerary with drag-and-drop functionality.  

**Goal:** Simplify group travel planning while leveraging AI for creative, personalized suggestions.  

---

## Features

- **Dynamic Itinerary Canvas:** Collaborative, real-time drag-and-drop planning.  
- **AI Suggestions:** Automatically generates itinerary recommendations based on group preferences, budget, and number of days.  
- **Voting & Decision Tree:** Quick group voting on destinations; AI interprets results to refine recommendations.  
- **Interactive Cards:** Each item (hotel, restaurant, location) has its own card with placeholder image and link.  
- **Multi-modal Discovery:** Upload photos to discover destinations with similar vibes.  
- **Real-time Updates:** Supabase-powered updates ensure all participants see changes instantly.  

---

## Demo

*(Insert screenshots or GIFs here)*  

1. Create a new travel canvas and invite group members.  
2. Add budget, number of days, and select preferred destinations.  
3. AI generates a set of proposals and decision tree questions.  
4. Group votes and final itinerary is automatically created.  
5. Drag-and-drop items to adjust the itinerary and request AI suggestions for optimization.  

---

## Technology Stack

- **Frontend:** Nuxt.js 3, Vue.js, Tailwind CSS  
- **Backend:** Supabase (PostgreSQL, Realtime DB, Auth, Edge Functions)  
- **AI Service:** Python FastAPI server for OpenAI GPT-4o/Vision integration  
- **Other:** vuedraggable for drag-and-drop interactions  

---

## Future Improvements

- Handle more edge cases and provide full real-world data for hotels, restaurants, and locations.  
- Add user accounts with history and saved itineraries.  
- Improve AI recommendation engine with richer multi-modal input.  
- Deploy a production-ready hosted version with optimized performance.  

---
