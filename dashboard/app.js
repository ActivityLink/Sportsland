// 全域設定
const CONFIG = {
    viewsPath: 'views/',
    componentsPath: 'components/'
};

// 路由設定
const ROUTES = {
    '#/overview': 'overview.html',
    '#/members': 'members.html',
    '#/courses': 'overview.html', // 課程主頁
    '#/courses/single': 'single-courses.html',
    '#/courses/package': 'package-courses.html',
    '#/courses/schedule': 'schedule.html',
    '#/messages': 'messages.html',
    '#/analytics': 'analytics.html',
    '#/settings': 'settings.html'
};

// 當前狀態
let currentView = 'overview';
let isInitialized = false;

// 初始化應用
async function initApp() {
    if (isInitialized) return;
    
    // 載入側邊欄
    await loadComponent('sidebar');
    
    // 載入頂部導航
    await loadComponent('topnav');
    
    // 設定側邊欄事件
    setupSidebar();
    
    // 設定路由監聽
    setupRouter();
    
    // 載入預設視圖
    const hash = window.location.hash || '#/overview';
    await navigateTo(hash);
    
    isInitialized = true;
}

// 載入元件
async function loadComponent(componentName) {
    try {
        const response = await fetch(`${CONFIG.componentsPath}${componentName}.html`);
        const html = await response.text();
        
        const container = document.getElementById(componentName);
        if (container) {
            container.innerHTML = html;
        }
        
        return html;
    } catch (error) {
        console.error(`載入元件 ${componentName} 失敗:`, error);
        return '';
    }
}

// 載入視圖
async function loadView(viewName) {
    const appContent = document.getElementById('app-content');
    
    // 顯示載入動畫
    appContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>載入中...</p>
        </div>
    `;
    
    try {
        const viewFile = ROUTES[`#/${viewName}`] || ROUTES[`#/courses/${viewName}`] || `${viewName}.html`;
        const response = await fetch(`${CONFIG.viewsPath}${viewFile}`);
        
        if (!response.ok) {
            throw new Error(`視圖 ${viewName} 不存在`);
        }
        
        const html = await response.text();
        
        // 更新麵包屑
        updateBreadcrumb(viewName);
        
        // 更新側邊欄選中狀態
        updateSidebarActive(viewName);
        
        // 插入內容
        appContent.innerHTML = html;
        
        // 執行視圖特定的初始化函數
        if (typeof window[`init${viewName.replace(/-/g, '').charAt(0).toUpperCase() + viewName.replace(/-/g, '').slice(1)}`] === 'function') {
            window[`init${viewName.replace(/-/g, '').charAt(0).toUpperCase() + viewName.replace(/-/g, '').slice(1)}`]();
        }
        
        currentView = viewName;
        
    } catch (error) {
        console.error('載入視圖失敗:', error);
        appContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>載入失敗</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadView('overview')">
                    返回儀表板
                </button>
            </div>
        `;
    }
}

// 導航到指定頁面
async function navigateTo(hash) {
    const viewName = hash.replace('#/', '').replace('courses/', 'courses/');
    await loadView(viewName || 'overview');
}

// 設定路由
function setupRouter() {
    // 監聽 hash 變化
    window.addEventListener('hashchange', () => {
        navigateTo(window.location.hash);
    });
    
    // 防止連結預設行為
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-view]')) {
            e.preventDefault();
            const view = e.target.getAttribute('data-view');
            window.location.hash = `#/${view}`;
        }
    });
}

// 設定側邊欄
function setupSidebar() {
    // 子菜單切換
    document.addEventListener('click', (e) => {
        if (e.target.closest('.has-submenu > .nav-link')) {
            e.preventDefault();
            const parent = e.target.closest('.has-submenu');
            parent.classList.toggle('active');
        }
    });
}

// 更新麵包屑
function updateBreadcrumb(viewName) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (!breadcrumb) return;
    
    const breadcrumbs = {
        'overview': ['儀表板'],
        'members': ['儀表板', '會員管理'],
        'single-courses': ['儀表板', '課程管理', '單堂課程'],
        'package-courses': ['儀表板', '課程管理', '課程包'],
        'schedule': ['儀表板', '課程管理', '排課管理'],
        'messages': ['儀表板', '訊息推播'],
        'analytics': ['儀表板', '數據分析'],
        'settings': ['儀表板', '系統設定']
    };
    
    const items = breadcrumbs[viewName] || ['儀表板'];
    
    breadcrumb.innerHTML = items.map((item, index) => {
        if (index === items.length - 1) {
            return `<span class="active">${item}</span>`;
        }
        return `<a href="#">${item}</a>`;
    }).join(' <span>/</span> ');
}

// 更新側邊欄選中狀態
function updateSidebarActive(viewName) {
    // 移除所有 active 類
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 為當前視圖添加 active
    const activeLink = document.querySelector(`[data-view="${viewName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        
        // 如果是在課程子頁面，也展開父級
        if (viewName.includes('courses')) {
            const parent = activeLink.closest('.has-submenu');
            if (parent) {
                parent.classList.add('active');
                const submenu = parent.querySelector('.submenu');
                if (submenu) submenu.style.display = 'block';
            }
        }
    }
}

// 顯示提示訊息
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 用戶選單
function toggleUserMenu() {
    // 實現用戶選單切換
    showToast('用戶選單功能', 'info');
}

// 初始化應用
document.addEventListener('DOMContentLoaded', initApp);
