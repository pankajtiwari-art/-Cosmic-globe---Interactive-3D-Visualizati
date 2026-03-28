# 🌍 Cosmic Globe - Interactive 3D Visualization

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg?style=for-the-badge)](https://pankajtiwari-art.github.io/-Cosmic-globe---Interactive-3D-Visualizati/)
[![Three.js](https://img.shields.io/badge/three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

> An advanced, highly optimized 3D web visualization engine featuring dynamic geometry, complex particle systems, and real-time post-processing effects. Built for performance and extreme customizability.

---

## ✨ What's New in this Advanced Version?

* **Distraction-Free UI:** The static info panel has been completely removed to maximize the 3D canvas space.
* **Collapsible Shortcuts:** A dedicated keyboard shortcut menu that is hidden by default to save space, toggleable via the top-right control panel.
* **Dynamic Geometry & Particles:** Real-time regeneration of vein density (30-200 veins) and environmental space dust (500-5000 particles) without dropping frames.
* **Granular Visual Control:** Individual toggles for every major element (Globe, Veins, Dust, Volcano) and live Color Pickers to completely alter the scene's aesthetic on the fly.

---

## 🎛️ Organized Control Sections

The GUI has been completely revamped into **7 distinct, highly organized sections** for ultimate control:

1. 🌍 **Visualization** - Manage Veins, Globe, Volcano, Dust, and Vein Density.
2. 🎬 **Animation** - Fine-tune global Rotation, Base Speed, Vein Flow, and Rotation Speed.
3. ✨ **Effects** - Control Bloom Toggle, Glow Toggle, Fog Density, and Bloom Strength.
4. 🎨 **Colors** - Live color pickers for Vein, Core, and Dust elements.
5. 📷 **Camera** - Adjust Orbit Damping, Zoom Speed, and a quick Reset button.
6. ⚡ **System** - Monitor Stats (Vertices/Triangles), V-Sync, Fullscreen toggle, and Reset All settings.
7. ⌨️ **Shortcuts** - Hide/Show the quick-access keyboard commands.

---

## ⌨️ Keyboard Shortcuts

Work like a pro with 12 dedicated keyboard shortcuts for instant toggling:

| Key | Action | Key | Action |
| :---: | :--- | :---: | :--- |
| `Space` | Toggle Global Rotation | `R` | Reset Camera Position |
| `B` | Toggle Bloom Effect | `S` | Toggle Performance Stats |
| `V` | Toggle Energy Veins | `F` | Toggle Fullscreen Mode |
| `D` | Toggle Space Dust | `H` | Show/Hide Shortcuts Panel |
| `G` | Toggle Core Globe | `+` | Increase Flow Speed |
| `L` | Toggle Glow Effect | `-` | Decrease Flow Speed |

---

## 🚀 Quick Start & Installation

No complex build process needed! The entire project is ultra-lightweight.

### File Sizes & Optimization
```text
index.html  → ~12 KB
style.css   → ~14 KB
script.js   → ~33 KB
---------------------
Total       → ~59 KB (Extremely optimized!)
```

### Local Development
Serve the files with any local web server. Open your terminal in the project directory:

```bash
# Option 1: Python 3
python -m http.server 8000

# Option 2: Node.js
npx http-server

# Option 3: PHP
php -S localhost:8000
```
Then navigate to `http://localhost:8000` in your web browser.

---

## 🛠️ Tech Stack

* **Rendering Engine:** [Three.js](https://threejs.org/) (WebGL)
* **GUI Elements:** lil-gui
* **Post-Processing:** EffectComposer, UnrealBloomPass
* **Languages:** Vanilla JavaScript (ES6+), HTML5, CSS3

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0). Free to use, study, share, and modify.

---
*Enjoy exploring the Cosmic Globe! 🌍✨*
