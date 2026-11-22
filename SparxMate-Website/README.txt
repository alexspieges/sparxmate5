SPARXMATE GALAXY — STANDALONE WEBSITE
====================================

This is the website version, NOT a Chrome or Edge extension. It has a galaxy-inspired dark theme and an adjustable study timer from 1 to 120 minutes.

FEATURES
- Galaxy-style purple and blue background with star details.
- Biology, Chemistry, Physics and mixed science modes.
- GCSE Year 9, 10 and 11 levels.
- Adjustable 1–120 minute timer.
- AI explanations and suggested answers.
- Optional image upload and question text entry.
- Copy suggested answer.

IMPORTANT LIMITATION
A normal standalone website cannot read another tab's contents or sign into Sparx Science. Browser security prevents one website from inspecting another website's page. This version does not request or store your Sparx password. To use it, type/paste the question or upload an image, then review your work and submit it yourself on Sparx.

LOCAL SETUP
1. Install Node.js LTS from https://nodejs.org/
2. Extract the SparxMate-Website folder.
3. Copy .env.example to a file named .env.
4. Put your private OpenAI API key in .env. Never upload .env to GitHub.
5. Open Command Prompt in the folder.
6. Run: npm install
7. Run: npm start
8. Open http://localhost:3210 in Edge.

NETLIFY
- Base directory: SparxMate-Website
- Build command: leave blank
- Publish directory: public
- Functions directory: netlify/functions
- Add OPENAI_API_KEY as a private Netlify environment variable.

API usage may cost money separately from a ChatGPT subscription.
