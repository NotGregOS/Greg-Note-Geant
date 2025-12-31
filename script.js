// 1. Initialisation du State
const store = {
    // On s'assure que c'est bien un tableau
    favorites: JSON.parse(localStorage.getItem('gregNoteFavs')) || [],
    viewMode: localStorage.getItem('gregNoteView') || 'view-grid',
    isSidebarCollapsed: localStorage.getItem('gregNoteSidebar') === 'true',

    toggleFav: function(url) {
        if (this.favorites.includes(url)) {
            this.favorites = this.favorites.filter(u => u !== url);
        } else {
            this.favorites.push(url);
        }
        localStorage.setItem('gregNoteFavs', JSON.stringify(this.favorites));
        // On relance le rendu pour que l'item bouge (dans la section favoris ou non)
        initDataAndRender(); 
    },

    toggleView: function() {
        this.viewMode = this.viewMode === 'view-grid' ? 'view-list' : 'view-grid';
        localStorage.setItem('gregNoteView', this.viewMode);
        renderContent(processedData); 
        dom.btnView.innerHTML = this.viewMode === 'view-grid' ? '▦' : '☰';
    },

    toggleSidebar: function() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        localStorage.setItem('gregNoteSidebar', this.isSidebarCollapsed);
        applySidebarState();
    }
};

const dom = {
    content: document.getElementById('content-area'),
    sidebar: document.getElementById('sidebar'),
    sidebarNav: document.getElementById('sidebar-nav'),
    search: document.getElementById('search-input'),
    stats: document.getElementById('stats-bar'),
    btnView: document.getElementById('btn-view-toggle'),
    btnSidebar: document.getElementById('btn-toggle-sidebar')
};

let processedData = [];

// 2. Fonctions Utilitaires
const utils = {
    slugify: (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    getDomain: (url) => { try { return new URL(url).hostname; } catch { return ''; } },
    isNew: (dateString) => {
        if (!dateString) return false;
        return (new Date() - new Date(dateString)) < (1000 * 60 * 60 * 24 * 60);
    },
    formatDate: (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' });
    },
    getColor: (str) => {
        const colors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#67e8f9', '#93c5fd', '#c4b5fd', '#f0abfc'];
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    },
    copy: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            const el = document.createElement('div');
            el.className = 'tooltip-copy show';
            el.textContent = 'Copié !';
            document.body.appendChild(el);
            setTimeout(() => { el.remove() }, 1500);
        });
    }
};

// 3. Logique Données
function processData(items) {
    const groups = {};
    const favItems = [];

    items.forEach(item => {
        // Est-ce un favori ?
        if (store.favorites.includes(item.url)) {
            // On crée une copie de l'objet pour la section favoris
            favItems.push({ ...item, isFavItem: true });
        }
        
        // Gestion catégorisation normale
        const cat = item.categories || "Divers";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    });

    let result = Object.keys(groups).sort().map(category => {
        // Tri par date décroissante
        const sorted = groups[category].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        return { category, items: sorted, isFavSection: false };
    });

    // Insertion Section Favoris en haut
    if (favItems.length > 0) {
        result.unshift({
            category: "Favoris",
            items: favItems,
            isFavSection: true
        });
    }
    return result;
}

// 4. Affichage
function renderSidebar(data) {
    dom.sidebarNav.innerHTML = '';
    data.forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        
        const icon = group.isFavSection ? '⭐' : '#'; 
        
        btn.innerHTML = `
            <span class="icon">${icon}</span>
            <span class="label">${group.category}</span>
            <span class="count">${group.items.length}</span>
        `;
        
        btn.onclick = () => {
            const el = document.getElementById(utils.slugify(group.category));
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        dom.sidebarNav.appendChild(btn);
    });
}

function renderContent(data) {
    dom.content.innerHTML = '';
    
    // Stats simples
    dom.stats.innerHTML = `${content.links.length} liens • ${data.length} groupes`;

    if (data.length === 0) {
        dom.content.innerHTML = '<div style="margin-top:50px;text-align:center;color:#666">Rien trouvé.</div>';
        return;
    }

    data.forEach(group => {
        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = utils.slugify(group.category);

        const color = group.isFavSection ? '#fbbf24' : utils.getColor(group.category);
        
        section.innerHTML = `
            <h2 class="category-title">
                ${group.category} 
                <span class="cat-tag" style="background:${color}">${group.isFavSection ? 'TOP' : group.category.substring(0,3)}</span>
            </h2>
        `;

        const container = document.createElement('div');
        container.className = `links-container ${store.viewMode}`;

        group.items.forEach(item => {
            const isFav = store.favorites.includes(item.url);
            
            // Wrapper pour positionner les boutons absolus
            const wrapper = document.createElement('div');
            wrapper.className = 'link-card-wrapper';

            // Boutons actions (DOM pur pour gérer les Events correctement)
            const actions = document.createElement('div');
            actions.className = 'card-actions';
            
            // Bouton Copy
            const btnCopy = document.createElement('button');
            btnCopy.className = 'action-btn';
            btnCopy.innerHTML = '📋';
            btnCopy.title = "Copier l'URL";
            btnCopy.onclick = (e) => {
                e.stopPropagation(); // Empêche le clic de traverser
                e.preventDefault();
                utils.copy(item.url);
            };

            // Bouton Fav
            const btnFav = document.createElement('button');
            btnFav.className = `action-btn fav-btn ${isFav ? 'active' : ''}`;
            btnFav.innerHTML = '★';
            btnFav.title = isFav ? "Retirer des favoris" : "Ajouter aux favoris";
            btnFav.onclick = (e) => {
                e.stopPropagation(); // CRUCIAL : empêche d'ouvrir le lien
                e.preventDefault();  // CRUCIAL
                store.toggleFav(item.url);
            };

            actions.appendChild(btnCopy);
            actions.appendChild(btnFav);

            // Carte Lien
            const card = document.createElement('a');
            card.className = 'link-card';
            card.href = item.url;
            card.target = '_blank';
            card.rel = 'noopener';

            const favicon = `https://www.google.com/s2/favicons?domain=${utils.getDomain(item.url)}&sz=32`;

            card.innerHTML = `
                <div class="card-header">
                    <img src="${favicon}" class="site-icon" onerror="this.style.opacity=0">
                    <div class="link-name">${item.name} ${utils.isNew(item.dateAdded) ? '<span class="badge-new">NEW</span>' : ''}</div>
                </div>
                <div class="link-desc">${item.description || ''}</div>
                <div class="card-footer">
                    <span>${utils.formatDate(item.dateAdded)}</span>
                    <span>↗</span>
                </div>
            `;

            wrapper.appendChild(actions);
            wrapper.appendChild(card);
            container.appendChild(wrapper);
        });

        section.appendChild(container);
        dom.content.appendChild(section);
    });
}

function applySidebarState() {
    if (store.isSidebarCollapsed) {
        dom.sidebar.classList.add('collapsed');
    } else {
        dom.sidebar.classList.remove('collapsed');
    }
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    
    // Filtre sur la base brute
    const filtered = content.links.filter(item => {
        return (item.name && item.name.toLowerCase().includes(term)) ||
               (item.categories && item.categories.toLowerCase().includes(term));
    });
    
    // On retraite pour l'affichage (re-crée les groupes, etc)
    const processed = processData(filtered);
    renderContent(processed);
}

function initDataAndRender() {
    processedData = processData(content.links);
    renderSidebar(processedData);
    renderContent(processedData);
}

function init() {
    if (typeof content === 'undefined') return alert('Erreur data.js');
    
    applySidebarState();
    dom.btnView.innerHTML = store.viewMode === 'view-grid' ? '▦' : '☰';

    initDataAndRender();

    // Listeners
    dom.search.addEventListener('input', handleSearch);
    dom.btnView.addEventListener('click', () => store.toggleView());
    dom.btnSidebar.addEventListener('click', () => store.toggleSidebar());
}

init();