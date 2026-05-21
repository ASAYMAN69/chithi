# Chithi - A Love Letter App 💌

Chithi is a private, shared digital space designed for specific users to exchange notes, media, and drawings. It features a nostalgic, pixel-art aesthetic inspired by Minecraft and classic web design.

## ✨ Features

- **Notes & Likes:** Share thoughts and "like" each other's notes.
- **Music & Reels:** Upload and play music or short videos (reels) in a shared space.
- **Interactive Canvas:** A built-in drawing board to doodle and save sketches.
- **Weather Integration:** Personalized weather backgrounds based on your location.
- **Privacy First:** Simple header-based authentication with a whitelist of allowed users.

## 🛠️ Technology Stack

- **Backend:** Node.js, Express, SQLite (`sql.js`).
- **Frontend:** Vanilla JavaScript, Modular CSS, HTML5.
- **Data Persistence:** All application data (DB, config, uploads) is stored safely in `$HOME/.chithi`.

## 📁 Project Structure

- `backend/`: Express server, API routes, and database logic.
- `docs/`: Frontend application (Single Page App).
- `useless/`: Legacy or experimental files.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (installed with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd chithi
   ```

2. **Install dependencies:**
   ```bash
   npm run install:backend
   ```

3. **Run Setup:**
   The setup script will ask for your usernames and location to configure the app.
   ```bash
   npm run setup
   ```

### Running the App

Start the backend server:
```bash
npm start
```
By default, the server runs on [http://localhost:6767](http://localhost:6767).

To view the frontend, you can open `docs/index.html` in your browser or host the `docs/` folder using any static file server (e.g., GitHub Pages).

## 🔒 Security Note

This app uses a whitelist system. Ensure you run the `setup` script to authorize your usernames before use. Configuration and uploaded files are stored in your home directory (`~/.chithi`) to keep your project folder clean and portable.

---
Made with ❤️ by asayman
