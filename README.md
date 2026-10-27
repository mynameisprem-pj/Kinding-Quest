# 🌱 Kindness Quest: Havenwood Village

> **Every small act of kindness can make a meaningful difference.**  
> A playable, multi-level 2D social-good adventure game built with **Phaser 3**, **Vite**, and a responsive **HTML5/CSS Overlay Architecture**.

---

## 🎯 Overview & Social Impact

**Kindness Quest** is an interactive 2D adventure game designed to promote empathy, civic responsibility, and community cooperation. Players explore **Havenwood Village**, speak with residents, discover everyday challenges, and see their actions visibly transform the surrounding environment.

The game features an interconnected **Level Progression Map**, where each level focuses on a distinct pillar of social responsibility:

*   **🤝 Level 1: The Helping Hand (Community Cooperation)**  
    Complete 6 foundational quests: delivering groceries to an elderly neighbor, setting up a peer reading circle, restoring a neglected community garden, organizing a community feast, delivering clinic wellness kits, and mediating a disagreement over shared public space.
*   **🧹 Level 2: Clean & Green Village (Civic Pride & Eco-Stewardship)**  
    Equip a bamboo street broom to sweep storm-littered walkways, sort riverside recyclables into community bins, and shut off leaking water taps to conserve water.
*   **🙏 Level 3: Respecting Elders & Empathy (Polite Manners & Inclusion)**  
    Practice respectful greetings with village elders, listen patiently to recover a lost family heirloom, and organize a Golden Lantern Welcome Circle for a shy newcomer.
*   **🐾 Levels 4 & 5 (Future Roadmap)**  
    *Animal Shelter & Wildlife Care* and *Digital Kindness & Anti-Cyberbullying*.

---

## ✨ Key Features

*   **🗺️ Interactive Level Progression Map:** Navigate through playable levels, track star ratings, and preview upcoming curriculum modules.
*   **🎓 Quick-Access Demo Mode:** Includes an optional unlock toggle on the Level Map so reviewers and educators can test any level immediately.
*   **🏹 Guided Onboarding & Live Objective Compass:** First-time players receive a 4-step spotlight tour of the interface, paired with a dynamic in-world directional arrow (`➤`) that points toward active quest targets.
*   **🏡 Dynamic World Transformations:** Completed quests permanently upgrade the village with blooming flower boxes, outdoor reading tables, lush garden beds, a community banquet table, recycling stations, and festival lanterns.
*   **🎵 Web Audio Synthesizer:** Gentle pastoral background music, footsteps, dialogue blips, item chimes, and completion chords generated natively via the browser's Web Audio API.
*   **📱 Responsive Desktop & Mobile Controls:** Full keyboard support (`WASD` / Arrows / `E` / `J` / `M` / `Esc`) on desktop and an adaptive virtual D-Pad + `ACT` button on touch devices.
*   **💾 Automatic Save System (`LocalStorage`):** Persists player position, quest states, inventory, earned badges, level progress, and audio/motion settings.

---

## 🎮 Controls

| Action | Desktop Keyboard / Mouse | Mobile / Tablet Touch |
| :--- | :--- | :--- |
| **Move Character** | `W` `A` `S` `D` or `Arrow Keys` | On-screen Virtual **D-Pad** |
| **Interact / Talk / Pick Up** | `E` Key (or click floating prompt) | Tap **`ACT`** Button (or tap prompt) |
| **Sweep Litter (Level 2)** | Walk over litter piles with Broom | Walk over litter piles with Broom |
| **Open Level Map** | `M` Key or click **`🗺️ Levels`** | Tap **`🗺️ Levels`** |
| **Open Quest Journal & Locator** | `J` Key or click **`📖 Quests`** | Tap **`📖 Quests`** |
| **Pause / Settings** | `Esc` Key or click **`⏸`** | Tap **`⏸`** |

---

## 🛠️ Technical Stack & Project Structure

*   **Game Engine:** [Phaser 3](https://phaser.io/) (Arcade Physics, TileSprites, Tweens, Camera System)
*   **Build Tool:** [Vite](https://vitejs.dev/) (ES Modules, fast HMR, optimized production bundle)
*   **UI Architecture:** Hybrid DOM + CSS overlay synced via a centralized Pub/Sub `EventBus` and `GameState` store.
*   **Persistence:** `LocalStorage` serialization with automatic fallback defaults.

```text
kindness-quest/
├── index.html                  # Game container & responsive HTML UI overlays
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
├── package.json                # Project dependencies & scripts
└── src/
    ├── main.js                 # Phaser 3 configuration & application entry point
    ├── style.css               # UI theme, Level Map, modals & responsive rules
    ├── core/
    │   ├── EventBus.js         # Pub/Sub event communication between Phaser & DOM
    │   ├── GameState.js        # Centralized state for levels, quests & inventory
    │   ├── SaveManager.js      # LocalStorage persistence & validation
    │   └── AudioManager.js     # Web Audio API music & sound effect synthesizer
    ├── data/
    │   ├── questsData.js       # Level definitions & quest state machines
    │   └── itemsData.js        # Item metadata, icons & descriptions
    ├── entities/
    │   └── Player.js           # 4-way movement, animations, dust effects & input
    ├── scenes/
    │   ├── BootScene.js        # Procedural 2D texture generator
    │   └── VillageScene.js     # Main world scene, collisions, NPCs & world upgrades
    └── ui/
        └── UIManager.js        # Level Map, tutorial coach, journal & dialogue UI

```

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm or yarn package manager

### Installation & Local Development

1. **Clone the repository:**
```bash
git clone [https://github.com/](https://github.com/)<your-username>/kindness-quest.git
cd kindness-quest

```


2. **Install dependencies:**
```bash
npm install

```


3. **Start the development server:**
```bash
npm run dev

```


Open your browser and navigate to `http://localhost:5173`.
4. **Build for production:**
```bash
npm run build

```


The compiled static assets will be output to the `dist/` folder.
5. **Preview the production build locally:**
```bash
npm run preview

```



---

## 📜 Credits & Licenses

* **Code License:** Licensed under the [MIT License](https://www.google.com/search?q=LICENSE).
* **Typography:** Fredoka and Nunito via Google Fonts (SIL Open Font License).
* **Graphics & Audio:** Procedurally generated via HTML5 Canvas (`BootScene.js`) and synthesized via the Web Audio API (`AudioManager.js`).
